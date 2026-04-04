// src/components/commissions/GlobalCommissionCard.tsx
import { useState } from 'react';
import { fmt } from '../../utils/formatHelpers';

interface GlobalCommissionCardProps {
  globalCommission: number;
  onUpdate: (value: number) => Promise<void>;
  loading: boolean;
}

export function GlobalCommissionCard({ globalCommission, onUpdate, loading }: GlobalCommissionCardProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(globalCommission);

  const handleSave = async () => {
    await onUpdate(inputValue);
    setEditing(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
      <div>
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
          ⚙️ Comissão Padrão Global
        </h3>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
          Valor base usado para novos passeios quando não há comissão específica definida.
        </p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputValue}
                onChange={e => setInputValue(parseFloat(e.target.value) || 0)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="pl-9 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 dark:bg-blue-950 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Salvar
            </button>
            <button onClick={() => { setEditing(false); setInputValue(globalCommission); }} className="text-gray-500 dark:text-gray-400 text-sm hover:underline">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fmt(globalCommission)}</span>
            <button onClick={() => setEditing(true)} className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              ✏️ Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}