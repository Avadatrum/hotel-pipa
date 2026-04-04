// src/components/commissions/PromotionFormModal.tsx
import { useState } from 'react';
import type { Tour } from '../../types/commission.types';

import { fmt } from '../../utils/formatHelpers';

interface PromotionFormModalProps {
  open: boolean;
  loading: boolean;
  tours: Tour[];
  onClose: () => void;
  onCreate: (data: { passeioId: string; valor: number; dataInicio: string; dataFim: string }) => Promise<void>;
}

export function PromotionFormModal({ open, loading, tours, onClose, onCreate }: PromotionFormModalProps) {
  const [form, setForm] = useState({
    passeioId: '',
    valor: 0,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: ''
  });

  if (!open) return null;

  const selectedTour = tours.find(t => t.id === form.passeioId);
  const diff = selectedTour ? form.valor - selectedTour.comissaoPadrao : 0;

  const handleSubmit = async () => {
    if (!form.passeioId || form.valor <= 0) return;
    await onCreate(form);
    setForm({ passeioId: '', valor: 0, dataInicio: new Date().toISOString().split('T')[0], dataFim: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">🔥 Nova Promoção</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="space-y-4">
          <select value={form.passeioId} onChange={e => setForm({ ...form, passeioId: e.target.value })} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700">
            <option value="">Selecione um passeio</option>
            {tours.filter(t => t.ativo !== false).map(tour => <option key={tour.id} value={tour.id}>{tour.nome}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Valor da Comissão Promocional" value={form.valor || ''} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700" />
          {selectedTour && form.valor > 0 && (
            <p className={`text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {diff > 0 ? `+${fmt(diff)} em relação ao padrão` : diff < 0 ? `${fmt(diff)} em relação ao padrão` : 'Igual ao padrão'}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} className="border rounded-lg px-3 py-2 dark:bg-gray-700" />
            <input type="date" value={form.dataFim} min={form.dataInicio} onChange={e => setForm({ ...form, dataFim: e.target.value })} className="border rounded-lg px-3 py-2 dark:bg-gray-700" />
          </div>
          <p className="text-xs text-gray-400">Sem data de fim = promoção permanente</p>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !form.passeioId || form.valor <= 0} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? '⏳ Criando...' : '🔥 Criar Promoção'}
          </button>
        </div>
      </div>
    </div>
  );
}