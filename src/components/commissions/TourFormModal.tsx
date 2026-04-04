// src/components/commissions/TourFormModal.tsx
import { useState } from 'react';


interface TourFormModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (data: { nome: string; precoBase: number; comissaoPadrao: number }) => Promise<void>;
}

export function TourFormModal({ open, loading, onClose, onCreate }: TourFormModalProps) {
  const [form, setForm] = useState({ nome: '', precoBase: 0, comissaoPadrao: 0 });

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.nome.trim()) return;
    await onCreate(form);
    setForm({ nome: '', precoBase: 0, comissaoPadrao: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">🎫 Novo Passeio</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="space-y-3">
          <input type="text" placeholder="Nome do passeio" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Preço Base" value={form.precoBase || ''} onChange={e => setForm({ ...form, precoBase: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700" />
            <input type="number" step="0.01" placeholder="Comissão" value={form.comissaoPadrao || ''} onChange={e => setForm({ ...form, comissaoPadrao: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !form.nome.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? '⏳ Criando...' : '🎫 Criar Passeio'}
          </button>
        </div>
      </div>
    </div>
  );
}