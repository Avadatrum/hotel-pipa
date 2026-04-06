// src/components/commissions/TourFormModal.tsx
import { useState } from 'react';
import type { TipoPreco } from '../../types/commission.types';

interface TourFormData {
  nome: string;
  tipoPreco: TipoPreco;
  precoBase: number;
  comissaoPadrao: number;
  capacidadeMaxima?: number;
}

interface TourFormModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (data: TourFormData) => Promise<void>;
}

const TIPO_PRECO_OPTIONS: { value: TipoPreco; label: string; description: string }[] = [
  {
    value: 'por_pessoa',
    label: 'Por pessoa',
    description: 'Preço e comissão são multiplicados pela quantidade de pessoas.',
  },
  {
    value: 'por_passeio',
    label: 'Por veículo / saída',
    description: 'Preço e comissão fixos por saída, independente do número de pessoas.',
  },
];

const EMPTY_FORM: TourFormData = {
  nome: '',
  tipoPreco: 'por_pessoa',
  precoBase: 0,
  comissaoPadrao: 0,
  capacidadeMaxima: undefined,
};

export function TourFormModal({ open, loading, onClose, onCreate }: TourFormModalProps) {
  const [form, setForm] = useState<TourFormData>(EMPTY_FORM);

  if (!open) return null;

  const set = (patch: Partial<TourFormData>) => setForm(f => ({ ...f, ...patch }));

  const handleSubmit = async () => {
    if (!form.nome.trim()) return;
    await onCreate(form);
    setForm(EMPTY_FORM);
  };

  const isPorPasseio = form.tipoPreco === 'por_passeio';
  const precoLabel = isPorPasseio ? 'Preço por veículo / saída' : 'Preço por pessoa';
  const comissaoLabel = isPorPasseio ? 'Comissão por veículo / saída' : 'Comissão por pessoa';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Novo passeio / transfer
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Nome
            </label>
            <input
              type="text"
              placeholder="Ex: Quadriciclo Baia dos Golfinhos, Transfer Aeroporto"
              value={form.nome}
              onChange={e => set({ nome: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Tipo de cobrança */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Tipo de cobrança
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPO_PRECO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set({ tipoPreco: opt.value, capacidadeMaxima: undefined })}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    form.tipoPreco === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Capacidade máxima (apenas por_passeio) */}
          {isPorPasseio && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Capacidade máxima de pessoas
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 4"
                value={form.capacidadeMaxima ?? ''}
                onChange={e =>
                  set({ capacidadeMaxima: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantas pessoas cabem neste veículo ou saída. Deixe em branco se não houver limite.
              </p>
            </div>
          )}

          {/* Preço e comissão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {precoLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.precoBase || ''}
                  onChange={e => set({ precoBase: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg pl-9 pr-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {comissaoLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.comissaoPadrao || ''}
                  onChange={e => set({ comissaoPadrao: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg pl-9 pr-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preview do cálculo */}
          {form.precoBase > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
              {isPorPasseio ? (
                <>
                  Preço fixo de <strong>R$ {form.precoBase.toFixed(2)}</strong> por saída
                  {form.capacidadeMaxima ? ` (até ${form.capacidadeMaxima} pessoas)` : ''}.
                  {form.comissaoPadrao > 0 && (
                    <> Comissão de <strong>R$ {form.comissaoPadrao.toFixed(2)}</strong> por saída.</>
                  )}
                </>
              ) : (
                <>
                  Preço de <strong>R$ {form.precoBase.toFixed(2)}</strong> por pessoa.
                  {form.comissaoPadrao > 0 && (
                    <>
                      {' '}Comissão de <strong>R$ {form.comissaoPadrao.toFixed(2)}</strong> por pessoa.
                      {' '}Para 2 pessoas: <strong>R$ {(form.comissaoPadrao * 2).toFixed(2)}</strong>.
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.nome.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}