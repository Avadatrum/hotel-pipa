// src/components/commissions/ToursTable.tsx
import { useState } from 'react';
import type { Tour } from '../../types/commission.types';
import { fmt } from '../../utils/formatHelpers';

interface ToursTableProps {
  tours: Tour[];
  loading: boolean;
  onUpdateName: (tourId: string, newName: string) => Promise<void>;
  onUpdatePrice: (tourId: string, newPrice: number) => Promise<void>;
  onUpdateCommission: (tour: Tour, newValue: number) => Promise<void>;
  onToggleActive: (tour: Tour) => Promise<void>;
}

export function ToursTable({ tours, loading, onUpdateName, onUpdatePrice, onUpdateCommission, onToggleActive }: ToursTableProps) {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(0);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-3 py-2.5 text-left">Passeio</th>
            <th className="px-3 py-2.5 text-center">Preço Base</th>
            <th className="px-3 py-2.5 text-center">Comissão</th>
            <th className="px-3 py-2.5 text-center">Status</th>
            <th className="px-3 py-2.5 text-center">Margem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {tours.map(tour => (
            <tr key={tour.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${tour.ativo === false ? 'opacity-50' : ''}`}>
              {/* Nome */}
              <td className="px-3 py-2.5">
                {editingNameId === tour.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      defaultValue={tour.nome}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && onUpdateName(tour.id, newName)}
                      className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 w-full"
                      autoFocus
                    />
                    <button onClick={() => onUpdateName(tour.id, newName)} className="text-green-600 font-bold px-1">✓</button>
                    <button onClick={() => setEditingNameId(null)} className="text-red-500 font-bold px-1">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{tour.nome}</span>
                    <button onClick={() => { setEditingNameId(tour.id); setNewName(tour.nome); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 text-xs">✏️</button>
                  </div>
                )}
               </td>

              {/* Preço */}
              <td className="px-3 py-2.5 text-center">
                {editingPriceId === tour.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number" step="0.01" min="0"
                      defaultValue={tour.precoBase}
                      onChange={e => setNewPrice(parseFloat(e.target.value) || 0)}
                      onKeyDown={e => e.key === 'Enter' && onUpdatePrice(tour.id, newPrice)}
                      className="w-24 pl-1 border rounded px-2 py-1 text-sm dark:bg-gray-700"
                      autoFocus
                    />
                    <button onClick={() => onUpdatePrice(tour.id, newPrice)} className="text-green-600 font-bold">✓</button>
                    <button onClick={() => setEditingPriceId(null)} className="text-red-500 font-bold">✕</button>
                  </div>
                ) : (
                  <div onClick={() => { setEditingPriceId(tour.id); setNewPrice(tour.precoBase); }} className="cursor-pointer group">
                    <span className="group-hover:text-blue-600 font-medium">{fmt(tour.precoBase)}</span>
                  </div>
                )}
               </td>

              {/* Comissão */}
              <td className="px-3 py-2.5 text-center">
                {editingCommissionId === tour.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number" step="0.01" min="0"
                      defaultValue={tour.comissaoPadrao}
                      onBlur={e => onUpdateCommission(tour, parseFloat(e.target.value) || 0)}
                      className="w-24 pl-1 border rounded px-2 py-1 text-sm dark:bg-gray-700"
                      autoFocus
                    />
                    <button onClick={() => setEditingCommissionId(null)} className="text-gray-500 text-xs">✕</button>
                  </div>
                ) : (
                  <div onClick={() => setEditingCommissionId(tour.id)} className="cursor-pointer group">
                    <span className="font-bold text-green-600 group-hover:text-green-700">{fmt(tour.comissaoPadrao)}</span>
                  </div>
                )}
               </td>

              {/* Status */}
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => onToggleActive(tour)} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tour.ativo !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                  {tour.ativo !== false ? '✅ Ativo' : '⏸ Inativo'}
                </button>
               </td>

              {/* Margem */}
              <td className="px-3 py-2.5 text-center text-xs text-gray-400">
                {tour.precoBase > 0 ? `${((tour.comissaoPadrao / tour.precoBase) * 100).toFixed(1)}%` : '—'}
               </td>
            </tr>
          ))}
        </tbody>
       </table>
    </div>
  );
}