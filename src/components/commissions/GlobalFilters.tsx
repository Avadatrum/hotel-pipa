// src/components/commissions/GlobalFilters.tsx

interface GlobalFiltersProps {
  filterVendedor: string;
  filterStatus: string;
  dateRange: { start: string; end: string };
  onFilterVendedorChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onClearFilters: () => void;
  uniqueVendors: string[];
  totalSalesCount: number;
  filteredSalesCount: number;
  hasFilters: boolean;  // 👈 Isso é boolean (true/false)
}

export function GlobalFilters({
  filterVendedor,
  filterStatus,
  dateRange,
  onFilterVendedorChange,
  onFilterStatusChange,
  onDateRangeChange,
  onClearFilters,
  uniqueVendors,
  totalSalesCount,
  filteredSalesCount,
  hasFilters,
}: GlobalFiltersProps) {
  
  const handleVendedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterVendedorChange(e.target.value);
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterStatusChange(e.target.value);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({ ...dateRange, start: e.target.value });
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({ ...dateRange, end: e.target.value });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
          🔍 Filtros
        </h3>
        {hasFilters && (
          <button 
            onClick={onClearFilters} 
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            Limpar ×
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select
          value={filterVendedor}
          onChange={handleVendedorChange}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os vendedores</option>
          {uniqueVendors.map(vendor => (
            <option key={vendor} value={vendor}>{vendor}</option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={handleStatusChange}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="confirmada">✅ Confirmada</option>
          <option value="cancelada">❌ Cancelada</option>
        </select>
        
        <input
          type="date"
          value={dateRange.start}
          onChange={handleStartDateChange}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="De"
        />
        
        <input
          type="date"
          value={dateRange.end}
          onChange={handleEndDateChange}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Até"
        />
      </div>
      
      {hasFilters && (
        <p className="mt-2 text-xs text-gray-400">
          Mostrando <strong className="text-gray-700 dark:text-gray-200">{filteredSalesCount}</strong> de{' '}
          <strong className="text-gray-700 dark:text-gray-200">{totalSalesCount}</strong> vendas
        </p>
      )}
    </div>
  );
}