// src/components/lostAndFound/LostItemFilters.tsx

import React from 'react';
import type { LostItemFilters as FiltersType, ItemCategory, ItemStatus } from '../../types/lostAndFound.types';

interface LostItemFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
}

const categories: { value: ItemCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',           label: 'Todas',          emoji: '🏷️' },
  { value: 'eletrônico',    label: 'Eletrônico',     emoji: '📱' },
  { value: 'documento',     label: 'Documento',      emoji: '📄' },
  { value: 'roupa',         label: 'Roupa',          emoji: '👕' },
  { value: 'acessório',     label: 'Acessório',      emoji: '💍' },
  { value: 'bagagem',       label: 'Bagagem',        emoji: '🧳' },
  { value: 'objeto_pessoal',label: 'Objeto Pessoal', emoji: '🎒' },
  { value: 'outro',         label: 'Outro',          emoji: '📦' },
];

const statuses: { value: ItemStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos'      },
  { value: 'guardado',   label: 'Guardado'   },
  { value: 'entregue',   label: 'Entregue'   },
  { value: 'descartado', label: 'Descartado' },
];

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

export const LostItemFilters: React.FC<LostItemFiltersProps> = ({ filters, onFilterChange }) => {
  const hasActiveFilters =
    filters.search || filters.category || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Filtros
        </p>
        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({})}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold transition-colors flex items-center gap-1"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Busca */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Buscar
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
            <input
              type="text"
              placeholder="Código, descrição, nome..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Categoria
          </label>
          <select
            value={filters.category || 'all'}
            onChange={(e) => {
              const v = e.target.value;
              onFilterChange({ ...filters, category: v === 'all' ? undefined : v as ItemCategory });
            }}
            className={inputCls}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => {
              const v = e.target.value;
              onFilterChange({ ...filters, status: v === 'all' ? undefined : v as ItemStatus });
            }}
            className={inputCls}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Período
          </label>
          <div className="flex gap-1.5">
            <input
              type="date"
              title="Data inicial"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                onFilterChange({ ...filters, startDate: e.target.value ? new Date(e.target.value) : undefined })
              }
              className={inputCls}
            />
            <input
              type="date"
              title="Data final"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                onFilterChange({ ...filters, endDate: e.target.value ? new Date(e.target.value) : undefined })
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
};