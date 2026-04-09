// src/components/commissions/TableFilters.tsx

interface Filters { cliente: string; passeio: string; dataPasseio: string; }

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  totalResults: number;
}

export function TableFilters({ filters, onFiltersChange, onClearFilters, hasFilters, }: Props) {
  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <input type="text" placeholder="Buscar cliente..." value={filters.cliente} onChange={e => set({ cliente: e.target.value })}
        className="flex-1 min-w-[140px] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="text" placeholder="Buscar passeio..." value={filters.passeio} onChange={e => set({ passeio: e.target.value })}
        className="flex-1 min-w-[140px] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="date" value={filters.dataPasseio} onChange={e => set({ dataPasseio: e.target.value })}
        title="Data do passeio"
        className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {hasFilters && (
        <button onClick={onClearFilters} className="text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">
          Limpar busca
        </button>
      )}
    </div>
  );
}