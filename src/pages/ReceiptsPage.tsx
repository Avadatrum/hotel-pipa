// src/pages/ReceiptsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import {
  collection, onSnapshot, query, orderBy, limit,
  addDoc, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import type { Receipt } from '../types';

// ─── Modal de pré-visualização / impressão ───────────────────────────────────
interface ReceiptModalProps {
  html: string;
  receipt: Receipt;
  onClose: () => void;
  onPrint: () => void;
}

function ReceiptModal({ html, receipt, onClose, onPrint }: ReceiptModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Recibo nº {receipt.num}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Emitido em {receipt.createdAt} — por {receipt.userName || 'Desconhecido'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none transition-colors"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Corpo: recibo */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div
            className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Footer: ações */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const EMPTY_FORM = {
  ref: '',
  name: '',
  cpf: '',
  value: '',
  date: new Date().toISOString().split('T')[0],
  period: '',
  extra: '',
};

export function ReceiptsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null); // ID do recibo em edição
  const [previewHtml, setPreviewHtml] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de visualização
  const [modalReceipt, setModalReceipt] = useState<Receipt | null>(null);
  const [modalHtml, setModalHtml] = useState('');

  // ── Helpers de formatação ──────────────────────────────────────────────────
  const valorPorExtenso = (valor: number): string => {
    if (valor <= 0) return '';
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const converter = (n: number): string => {
      if (n === 0) return '';
      if (n === 100) return 'cem';
      if (n < 10) return unidades[n];
      if (n < 20) return especiais[n - 10];
      if (n < 100) { const d = Math.floor(n / 10); const u = n % 10; return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : ''); }
      const c = Math.floor(n / 100); const r = n % 100;
      return centenas[c] + (r > 0 ? ' e ' + converter(r) : '');
    };
    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);
    let resultado = '';
    if (inteiro > 0) {
      if (inteiro >= 1000) {
        const milhares = Math.floor(inteiro / 1000); const resto = inteiro % 1000;
        resultado += converter(milhares) + ' mil';
        if (resto > 0) { resultado += resto < 100 ? ' e ' : ' '; resultado += converter(resto); }
      } else { resultado += converter(inteiro); }
      resultado += inteiro === 1 ? ' real' : ' reais';
    }
    if (centavos > 0) {
      if (inteiro > 0) resultado += ' e ';
      resultado += converter(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
    }
    return resultado;
  };

  const buildHtml = useCallback((data: typeof EMPTY_FORM) => {
    const value = parseFloat(data.value) || 0;
    const valueFormatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const valueExtenso = valorPorExtenso(value);
    const dateFormatted = data.date
      ? new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const periodText = data.period ? ` a serem utilizados no ${data.period}` : '';
    const extraText = data.extra ? ` ${data.extra}` : '';

    return `
      <div class="text-center mb-3">
        <img src="https://i.imgur.com/A4vP7cE.png" alt="Logo Hotel da Pipa" class="h-16 mx-auto mb-2" />
        <div class="text-xs uppercase tracking-wider text-gray-500">Pipa · RN · Brasil</div>
      </div>
      <hr class="my-2 border-gray-300">
      <div class="text-center mb-4">
        <div class="text-xl font-bold uppercase tracking-wider">R E C I B O</div>
        <div class="text-sm text-gray-500 mt-1">Ref: ${data.ref || '—'}</div>
      </div>
      <div class="text-sm text-justify leading-relaxed mb-4">
        RECEBI da empresa <strong>EG PRESTADORA DE SERVIÇO LTDA</strong>, ente jurídico de direito privado,
        inscrito no CNPJ/MF sob o nº 46.619.2013/001-05, com sede na Av Campos Sales, nº382,
        Petropólis, Natal/RN, a importância de <strong>${valueExtenso || valueFormatted}</strong> (R$ ${valueFormatted})
        referente a ${data.ref || 'serviço prestado'}${periodText} do que lhe dou plena quitação pelo
        recebimento do mesmo.${extraText}
      </div>
      <div class="text-center text-sm mb-4">
        Tibau do Sul, ${dateFormatted || '___/___/_____'}
      </div>
      <div class="text-center">
        <div class="border-t border-gray-400 w-48 mx-auto mb-1"></div>
        <div class="font-bold text-sm">${data.name || '—'}</div>
        <div class="text-xs text-gray-500">CPF: ${data.cpf || '—'}</div>
      </div>
    `;
  }, []);

  // ── Atualizar preview do formulário ───────────────────────────────────────
  useEffect(() => {
    setPreviewHtml(buildHtml(formData));
  }, [formData, buildHtml]);

  // ── Buscar recibos do Firestore ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'receipts'), orderBy('ts', 'desc'), limit(50)),
      (snapshot) => {
        const items: Receipt[] = [];
        snapshot.forEach(d => items.push({ id: d.id, ...d.data() } as Receipt));
        setReceipts(items);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Abrir recibo salvo no formulário para edição ───────────────────────────
  const loadReceiptForEdit = (receipt: Receipt) => {
    setFormData({
      ref: receipt.ref || '',
      name: receipt.name || '',
      cpf: receipt.cpf || '',
      value: receipt.value || '',
      date: receipt.date || new Date().toISOString().split('T')[0],
      period: receipt.period || '',
      extra: receipt.extra || '',
    });
    setEditingId(receipt.id!);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('✏️ Recibo carregado para edição', 'info');
  };

  // ── Cancelar edição ────────────────────────────────────────────────────────
  const cancelEdit = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
  };

  // ── Salvar (novo ou editar) ────────────────────────────────────────────────
  const saveReceipt = async () => {
    if (!formData.name || !formData.value) {
      showToast('⚠️ Preencha pelo menos nome e valor', 'warning');
      return;
    }

    if (editingId) {
      // ATUALIZAR recibo existente
      const receiptRef = doc(db, 'receipts', editingId);
      await updateDoc(receiptRef, {
        ...formData,
        updatedAt: new Date().toLocaleDateString('pt-BR'),
        updatedTs: Date.now(),
        updatedBy: user?.name || 'Desconhecido',
      });
      showToast('✅ Recibo atualizado com sucesso!', 'success');
      cancelEdit();
    } else {
      // CRIAR novo recibo
      const newReceipt: Omit<Receipt, 'id'> = {
        ...formData,
        num: String(receipts.length + 1).padStart(4, '0'),
        createdAt: new Date().toLocaleDateString('pt-BR'),
        ts: Date.now(),
        userId: user?.id || 'unknown',
        userName: user?.name || 'Usuário Desconhecido',
      };
      await addDoc(collection(db, 'receipts'), newReceipt);
      showToast(`✅ Recibo nº ${newReceipt.num} salvo com sucesso!`, 'success');
      setFormData({ ...EMPTY_FORM });
    }
  };

  // ── Excluir recibo ─────────────────────────────────────────────────────────
  const deleteReceipt = async (id: string) => {
    if (confirm('⚠️ Tem certeza que deseja excluir este recibo?')) {
      await deleteDoc(doc(db, 'receipts', id));
      if (editingId === id) cancelEdit();
      showToast('🗑️ Recibo excluído com sucesso!', 'success');
    }
  };

  // ── Abrir modal de visualização ────────────────────────────────────────────
  const openReceiptModal = (receipt: Receipt) => {
    const html = buildHtml({
      ref: receipt.ref || '',
      name: receipt.name || '',
      cpf: receipt.cpf || '',
      value: receipt.value || '',
      date: receipt.date || '',
      period: receipt.period || '',
      extra: receipt.extra || '',
    });
    setModalHtml(html);
    setModalReceipt(receipt);
  };

  // ── Imprimir (HTML atual do formulário) ────────────────────────────────────
  const doPrint = (html: string) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo Hotel da Pipa</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 500px; margin: 0 auto; }
          .text-center { text-align: center; }
          .text-justify { text-align: justify; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-xl { font-size: 1.25rem; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .tracking-wider { letter-spacing: 0.05em; }
          .border-t { border-top: 1px solid #9ca3af; }
          .mt-1 { margin-top: 0.25rem; }
          .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .w-48 { width: 12rem; }
          .h-16 { height: 4rem; }
          .leading-relaxed { line-height: 1.625; }
          .border-gray-300 { border-color: #d1d5db; }
          .text-gray-500 { color: #6b7280; }
          hr { border: none; border-top: 1px solid #d1d5db; }
          strong { font-weight: bold; }
        </style>
      </head>
      <body>
        ${html}
        <script>window.onload = () => { setTimeout(() => window.print(), 500); }<\/script>
      </body>
      </html>
    `);
    printWindow?.document.close();
  };

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filteredReceipts = receipts.filter(r =>
    !searchTerm ||
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.num?.includes(searchTerm)
  );

  // ── Estatísticas rápidas ───────────────────────────────────────────────────
  const totalValue = receipts.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);
  const totalFormatted = totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Modal de visualização */}
      {modalReceipt && (
        <ReceiptModal
          html={modalHtml}
          receipt={modalReceipt}
          onClose={() => setModalReceipt(null)}
          onPrint={() => doPrint(modalHtml)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Recibos</h1>
        {/* Estatísticas rápidas */}
        <div className="flex gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-2 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total emitido</div>
            <div className="font-bold text-green-600 text-base">R$ {totalFormatted}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-2 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Recibos</div>
            <div className="font-bold text-blue-600 text-base">{receipts.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Formulário ── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">
              {editingId ? '✏️ Editando Recibo' : '📝 Novo Recibo'}
            </h2>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 underline transition-colors"
              >
                Cancelar edição
              </button>
            )}
          </div>

          {/* Banner de edição */}
          {editingId && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs">
              ⚠️ Você está editando um recibo existente. As alterações serão salvas no registro original.
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referência</label>
              <input
                type="text"
                value={formData.ref}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                placeholder="Ex: Serviço de transporte"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do prestador *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período (opcional)</label>
              <input
                type="text"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="Ex: 1 a 15 de março de 2026"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
              <textarea
                rows={2}
                value={formData.extra}
                onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
                placeholder="Informações adicionais..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveReceipt}
                className={`flex-1 text-white py-2 rounded-lg transition-colors font-semibold ${
                  editingId
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {editingId ? '💾 Salvar alterações' : '💾 Salvar'}
              </button>
              <button
                onClick={() => doPrint(previewHtml)}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* ── Pré-visualização ── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">👁️ Pré-visualização</h2>
          <div
            className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {/* ── Lista de recibos ── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">📋 Últimos Recibos</h2>

          {/* Busca */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por nome, ref ou nº..."
            className="w-full sm:w-64 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {filteredReceipts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchTerm ? 'Nenhum recibo encontrado para essa busca' : 'Nenhum recibo salvo ainda'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredReceipts.map(recibo => (
              <div
                key={recibo.id}
                className={`border rounded-lg p-3 transition-all bg-white dark:bg-gray-700 hover:shadow-md ${
                  editingId === recibo.id
                    ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-400'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Info principal */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      Recibo nº {recibo.num}
                      {recibo.updatedAt && (
                        <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] px-1 rounded">
                          editado
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm mt-0.5 text-gray-800 dark:text-gray-200 truncate">{recibo.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{recibo.ref || '—'}</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      R$ {parseFloat(recibo.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{recibo.createdAt}</div>
                    {recibo.userName && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">por {recibo.userName}</div>
                    )}
                  </div>

                  {/* Botão excluir */}
                  <button
                    onClick={() => deleteReceipt(recibo.id!)}
                    className="text-red-400 hover:text-red-600 text-sm transition-colors flex-shrink-0 ml-2"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>

                {/* Ações do card */}
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                  {/* Visualizar */}
                  <button
                    onClick={() => openReceiptModal(recibo)}
                    title="Visualizar e imprimir"
                    className="flex-1 text-xs flex items-center justify-center gap-1 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors font-medium"
                  >
                    👁️ Ver
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => loadReceiptForEdit(recibo)}
                    title="Carregar no formulário para edição"
                    className="flex-1 text-xs flex items-center justify-center gap-1 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors font-medium"
                  >
                    ✏️ Editar
                  </button>

                  {/* Imprimir direto */}
                  <button
                    onClick={() => doPrint(buildHtml({
                      ref: recibo.ref || '',
                      name: recibo.name || '',
                      cpf: recibo.cpf || '',
                      value: recibo.value || '',
                      date: recibo.date || '',
                      period: recibo.period || '',
                      extra: recibo.extra || '',
                    }))}
                    title="Imprimir este recibo"
                    className="flex-1 text-xs flex items-center justify-center gap-1 py-1.5 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 transition-colors font-medium"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
