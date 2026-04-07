// src/components/commissions/GlobalFilters.tsx

interface Props {
  filterVendedor: string;
  filterStatus: string;
  dateRange: { start: string; end: string };
  uniqueVendors: string[];
  totalSalesCount: number;
  filteredSalesCount: number;
  hasFilters: boolean;
  onFilterVendedorChange: (v: string) => void;
  onFilterStatusChange: (v: string) => void;
  onDateRangeChange: (r: { start: string; end: string }) => void;
  onClearFilters: () => void;
}

export function GlobalFilters({ filterVendedor, filterStatus, dateRange, uniqueVendors, totalSalesCount, filteredSalesCount, hasFilters, onFilterVendedorChange, onFilterStatusChange, onDateRangeChange, onClearFilters }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Vendedor */}
        {uniqueVendors.length > 0 && (
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Vendedor</label>
            <select value={filterVendedor} onChange={e => onFilterVendedorChange(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}

        {/* Status */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Status</label>
          <select value={filterStatus} onChange={e => onFilterStatusChange(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="confirmada">Confirmadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        {/* Data início */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">De</label>
          <input type="date" value={dateRange.start} onChange={e => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Data fim */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Até</label>
          <input type="date" value={dateRange.end} onChange={e => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Limpar */}
        {hasFilters && (
          <button onClick={onClearFilters}
            className="px-4 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Resultado */}
      {hasFilters && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Exibindo <strong>{filteredSalesCount}</strong> de <strong>{totalSalesCount}</strong> vendas
        </p>
      )}
    </div>
  );
}