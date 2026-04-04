// src/components/commissions/Pagination.tsx

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calcula quais páginas mostrar (máximo 5)
  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-gray-500 text-xs">
        Página {page} de {totalPages} · {totalItems} registros
      </span>
      <div className="flex gap-1">
        {/* Primeira página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-2 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
          aria-label="Primeira página"
        >
          «
        </button>

        {/* Página anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
          aria-label="Página anterior"
        >
          ‹
        </button>

        {/* Botões de páginas numéricas */}
        {visiblePages.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-2.5 py-1 border rounded text-xs transition-colors ${
              page === pageNum
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600'
            }`}
            aria-label={`Ir para página ${pageNum}`}
            aria-current={page === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {/* Próxima página */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
          aria-label="Próxima página"
        >
          ›
        </button>

        {/* Última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="px-2 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}