// src/components/commissions/TableFilters.tsx

// 👇 Passo 1: Definir o tipo dos filtros (igual ao do Dashboard)
interface TableFiltersState {
  cliente: string;
  passeio: string;
  dataPasseio: string;
}

// 👇 Passo 2: Definir as props que o componente vai receber
interface TableFiltersProps {
  filters: TableFiltersState;           // Os valores atuais dos filtros
  onFiltersChange: (filters: TableFiltersState) => void;  // Função para atualizar
  onClearFilters: () => void;           // Função para limpar tudo
  hasFilters: boolean;                  // Se tem algum filtro ativo
  totalResults: number;                 // Quantidade de resultados (para mostrar no título)
}

export function TableFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasFilters,
  totalResults,
}: TableFiltersProps) {

  // 👇 Passo 3: Criar handlers específicos para cada campo
  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, cliente: e.target.value });
  };

  const handlePasseioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, passeio: e.target.value });
  };

  const handleDataPasseioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dataPasseio: e.target.value });
  };

  // 👇 Passo 4: Renderizar (igual ao código original)
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
      {/* Título com contador */}
      <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
        📋 Vendas Realizadas
        <span className="ml-2 text-xs font-normal text-gray-400">
          ({totalResults})
        </span>
      </h3>

      {/* Inputs de filtro */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro por Cliente */}
        <input
          type="text"
          placeholder="🔍 Cliente..."
          value={filters.cliente}
          onChange={handleClienteChange}
          className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
        />

        {/* Filtro por Passeio */}
        <input
          type="text"
          placeholder="🎫 Passeio..."
          value={filters.passeio}
          onChange={handlePasseioChange}
          className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
        />

        {/* Filtro por Data do Passeio */}
        <input
          type="date"
          value={filters.dataPasseio}
          onChange={handleDataPasseioChange}
          className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Botão Limpar (só aparece se tiver filtros) */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            ✕ Limpar
          </button>
        )}
      </div>
    </div>
  );
}