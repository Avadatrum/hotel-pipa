// src/components/commissions/TourFormModal.tsx - Atualizado com RichTextEditor
import { useState } from 'react';
import type { TipoPreco } from '../../types/commission.types';
import { RichTextEditor } from './RichTextEditor'; // 🆕

interface TourFormData {
  nome: string;
  descricao: string;
  tipoPreco: TipoPreco;
  precoBase: number;
  comissaoPadrao: number;
  capacidadeMaxima?: number;
}

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (data: TourFormData) => Promise<void>;
}

const EMPTY: TourFormData = { nome: '', descricao: '', tipoPreco: 'por_pessoa', precoBase: 0, comissaoPadrao: 0 };

export function TourFormModal({ open, loading, onClose, onCreate }: Props) {
  const [form, setForm] = useState<TourFormData>(EMPTY);
  if (!open) return null;

  const set = (p: Partial<TourFormData>) => setForm(f => ({ ...f, ...p }));
  const isPorPasseio = form.tipoPreco === 'por_passeio';

  const handleSubmit = async () => {
    if (!form.nome.trim()) return;
    await onCreate(form);
    setForm(EMPTY);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">Novo passeio / transfer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Nome</label>
            <input type="text" value={form.nome} onChange={e => set({ nome: e.target.value })}
              placeholder="Ex: Transfer Aeroporto, Quadriciclo Baia dos Golfinhos"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>

          {/* 🆕 Descrição com Editor Rico */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Descrição para o site ✨
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Formate o texto com a barra de ferramentas. Adicione títulos, negrito, imagens e links.
            </p>
            <RichTextEditor
              value={form.descricao}
              onChange={(value) => set({ descricao: value })}
              placeholder="Descreva o passeio com detalhes atrativos para os hóspedes..."
            />
          </div>

          {/* Tipo de cobrança */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Tipo de cobrança</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'por_pessoa', label: 'Por pessoa', desc: 'Preço x nº de pessoas' },
                { value: 'por_passeio', label: 'Por veículo / saída', desc: 'Preço fixo por saída' },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => set({ tipoPreco: opt.value, capacidadeMaxima: undefined })}
                  className={`text-left p-3 rounded-xl border-2 transition-colors ${form.tipoPreco === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <div className="text-sm font-medium text-gray-800 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Capacidade */}
          {isPorPasseio && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Capacidade máxima</label>
              <input type="number" min="1" placeholder="Ex: 4"
                value={form.capacidadeMaxima ?? ''} onChange={e => set({ capacidadeMaxima: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Quantas pessoas cabem por veículo / saída.</p>
            </div>
          )}

          {/* Preço e Comissão */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: isPorPasseio ? 'Preço por saída' : 'Preço por pessoa', key: 'precoBase' as const },
              { label: isPorPasseio ? 'Comissão por saída' : 'Comissão por pessoa', key: 'comissaoPadrao' as const },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="number" min="0" step="0.01" placeholder="0,00"
                    value={form[field.key] || ''}
                    onChange={e => set({ [field.key]: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {form.precoBase > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
              {isPorPasseio
                ? <>Preço fixo de <strong>R$ {form.precoBase.toFixed(2)}</strong> por saída{form.capacidadeMaxima ? ` (até ${form.capacidadeMaxima} pessoas)` : ''}.</>
                : <>Preço de <strong>R$ {form.precoBase.toFixed(2)}</strong> por pessoa.</>
              }
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !form.nome.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}