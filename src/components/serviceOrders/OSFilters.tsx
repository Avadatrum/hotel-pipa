// src/components/serviceOrders/OSFilters.tsx
import { useState, useEffect } from 'react';
import { 
  type OSStatus, 
  // type OSPriority, // Removido
  OS_STATUS, 
  // OS_PRIORIDADES, // Removido
  // OS_LOCAIS_PADRAO, // Removido
  type OSFilters as OSFiltersType 
} from '../../types/serviceOrder.types';

interface OSFiltersProps {
  onFilterChange: (filters: OSFiltersType) => void;
  onClear: () => void;
  activeFilters: OSFiltersType;
  totalResults?: number;
}

export function OSFilters({ onFilterChange, onClear, activeFilters, totalResults }: OSFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<OSFiltersType>(activeFilters);
  
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);
  
  const handleStatusToggle = (status: OSStatus) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    
    const newFilters = { ...localFilters, status: updated };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // handlePriorityToggle removido
  
  const handleSearchChange = (search: string) => {
    const newFilters = { ...localFilters, search };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleClearAll = () => {
    setLocalFilters({});
    onClear();
  };
  
  const hasActiveFilters = Object.keys(activeFilters).length > 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Barra de busca principal */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por número, título, descrição ou local..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 
                     dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <span>Filtros</span>
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 
                       bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 
                       dark:hover:bg-red-900/30 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
        
        {totalResults !== undefined && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} encontrados
          </div>
        )}
      </div>
      
      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Filtro por Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {OS_STATUS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusToggle(value)}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg transition-all duration-200
                    ${localFilters.status?.includes(value)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Seção de Prioridade REMOVIDA */}
          
          {/* Filtro por Local - Alterado para Input de Texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Local
            </label>
            <input
              type="text"
              value={localFilters.local || ''}
              onChange={(e) => {
                const newFilters = { ...localFilters, local: e.target.value || undefined };
                setLocalFilters(newFilters);
                onFilterChange(newFilters);
              }}
              placeholder="Filtrar por local..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      
      {/* Chips de filtros ativos */}
      {hasActiveFilters && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {activeFilters.status?.map(status => {
            const config = OS_STATUS.find(s => s.value === status);
            return (
              <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                {config?.label}
                <button onClick={() => handleStatusToggle(status)} className="hover:text-blue-900">✕</button>
              </span>
            );
          })}
          {/* Chips de prioridade REMOVIDOS */}
        </div>
      )}
    </div>
  );
}