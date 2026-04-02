// src/pages/ReceiptsPage.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext'; // Importação necessária
import type { Receipt } from '../types';

export function ReceiptsPage() {
  const { showToast } = useToast();
  const { user } = useAuth(); // Obter o usuário logado
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [formData, setFormData] = useState({
    ref: '',
    name: '',
    cpf: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    period: '',
    extra: ''
  });
  const [previewHtml, setPreviewHtml] = useState('');

  // Buscar recibos salvos
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'receipts'), orderBy('ts', 'desc'), limit(50)),
      (snapshot) => {
        const items: Receipt[] = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as Receipt);
        });
        setReceipts(items);
      }
    );
    return () => unsubscribe();
  }, []);

  // Atualizar preview quando o formulário mudar
  useEffect(() => {
    generatePreview();
  }, [formData]);

  const generatePreview = () => {
    const value = parseFloat(formData.value) || 0;
    const valueFormatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const valueExtenso = valorPorExtenso(value);
    const dateFormatted = formData.date ? new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const periodText = formData.period ? ` a serem utilizados no ${formData.period}` : '';
    const extraText = formData.extra ? ` ${formData.extra}` : '';

    const html = `
      <div class="text-center mb-3">
  <img 
    src="https://i.imgur.com/A4vP7cE.png" 
    alt="Logo Hotel da Pipa" 
    class="h-16 mx-auto mb-2"
  />
  <div class="text-xs uppercase tracking-wider text-gray-500">Pipa · RN · Brasil</div>
</div>
      <hr class="my-2 border-gray-300">
      <div class="text-center mb-4">
        <div class="text-xl font-bold uppercase tracking-wider">R E C I B O</div>
        <div class="text-sm text-gray-500 mt-1">Ref: ${formData.ref || '—'}</div>
      </div>
      <div class="text-sm text-justify leading-relaxed mb-4">
        RECEBI da empresa <strong>EG PRESTADORA DE SERVIÇO LTDA</strong>, ente jurídico de direito privado, 
        inscrito no CNPJ/MF sob o nº 46.619.2013/001-05, com sede na Av Campos Sales, nº382, 
        Petropólis, Natal/RN, a importância de <strong>${valueExtenso || valueFormatted}</strong> (R$ ${valueFormatted}) 
        referente a ${formData.ref || 'serviço prestado'}${periodText} do que lhe dou plena quitação pelo 
        recebimento do mesmo.${extraText}
      </div>
      <div class="text-center text-sm mb-4">
        Tibau do Sul, ${dateFormatted || '___/___/_____'}
      </div>
      <div class="text-center">
        <div class="border-t border-gray-400 w-48 mx-auto mb-1"></div>
        <div class="font-bold text-sm">${formData.name || '—'}</div>
        <div class="text-xs text-gray-500">CPF: ${formData.cpf || '—'}</div>
      </div>
    `;

    setPreviewHtml(html);
  };

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
      if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
      }
      const c = Math.floor(n / 100);
      const r = n % 100;
      return centenas[c] + (r > 0 ? ' e ' + converter(r) : '');
    };

    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);
    
    let resultado = '';
    if (inteiro > 0) {
      if (inteiro >= 1000) {
        const milhares = Math.floor(inteiro / 1000);
        const resto = inteiro % 1000;
        resultado += converter(milhares) + ' mil';
        if (resto > 0) {
          resultado += resto < 100 ? ' e ' : ' ';
          resultado += converter(resto);
        }
      } else {
        resultado += converter(inteiro);
      }
      resultado += inteiro === 1 ? ' real' : ' reais';
    }
    
    if (centavos > 0) {
      if (inteiro > 0) resultado += ' e ';
      resultado += converter(centavos);
      resultado += centavos === 1 ? ' centavo' : ' centavos';
    }
    
    return resultado;
  };

  const saveReceipt = async () => {
    if (!formData.name || !formData.value) {
      showToast('⚠️ Preencha pelo menos nome e valor', 'warning');
      return;
    }

    // CORREÇÃO AQUI: Adicionando userId e userName
    const newReceipt: Omit<Receipt, 'id'> = {
      ...formData,
      num: String(receipts.length + 1).padStart(4, '0'),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      ts: Date.now(),
      userId: user?.id || 'unknown', // Adicionado
      userName: user?.name || 'Usuário Desconhecido', // Adicionado
    };

    await addDoc(collection(db, 'receipts'), newReceipt);
    showToast(`✅ Recibo nº ${newReceipt.num} salvo com sucesso!`, 'success');
    
    setFormData({
      ref: '',
      name: '',
      cpf: '',
      value: '',
      date: new Date().toISOString().split('T')[0],
      period: '',
      extra: ''
    });
  };

  const deleteReceipt = async (id: string) => {
    if (confirm('⚠️ Tem certeza que deseja excluir este recibo?')) {
      await deleteDoc(doc(db, 'receipts', id));
      showToast('🗑️ Recibo excluído com sucesso!', 'success');
    }
  };

  const printReceipt = () => {
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
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .tracking-wider { letter-spacing: 0.05em; }
          .border-t { border-top: 1px solid #ccc; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .w-48 { width: 12rem; }
          .leading-relaxed { line-height: 1.5; }
        </style>
      </head>
      <body>
        ${previewHtml}
        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); }
        </script>
      </body>
      </html>
    `);
    printWindow?.document.close();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Recibos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">📝 Novo Recibo</h2>
          
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
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 Salvar
              </button>
              <button
                onClick={printReceipt}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">👁️ Pré-visualização</h2>
          <div 
            className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-4">📋 Últimos Recibos</h2>
        {receipts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum recibo salvo ainda</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {receipts.map(recibo => (
              <div key={recibo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Recibo nº {recibo.num}</div>
                    <div className="font-semibold text-sm mt-1 text-gray-800 dark:text-gray-200">{recibo.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{recibo.ref || '—'}</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      R$ {parseFloat(recibo.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{recibo.createdAt}</div>
                  </div>
                  <button
                    onClick={() => deleteReceipt(recibo.id!)}
                    className="text-red-500 hover:text-red-700 text-sm transition-colors"
                    title="Excluir"
                  >
                    🗑️
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