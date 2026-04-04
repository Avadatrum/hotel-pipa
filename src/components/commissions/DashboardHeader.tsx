// src/components/commissions/DashboardHeader.tsx

interface DashboardHeaderProps {
  onExportCSV: () => void;
  onDeleteAll: () => void;
  isAdmin: boolean;
  hasSalesToDelete: boolean;
  isDeletingAll: boolean;
  filteredSalesCount: number;
}

export function DashboardHeader({
  onExportCSV,
  onDeleteAll,
  isAdmin,
  hasSalesToDelete,
  isDeletingAll,
  filteredSalesCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        📊 Dashboard de Comissões
      </h1>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onExportCSV}
          disabled={filteredSalesCount === 0}
          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
        >
          📥 Exportar CSV
        </button>
        {isAdmin && hasSalesToDelete && (
          <button
            onClick={onDeleteAll}
            disabled={isDeletingAll}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-60"
          >
            {isDeletingAll ? <span className="animate-spin inline-block">⏳</span> : '🗑️'}
            {isDeletingAll ? 'Excluindo…' : 'Excluir filtrados'}
          </button>
        )}
      </div>
    </div>
  );
}