// src/components/commissions/SalesTable.tsx
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';

// 👇 Tipo para uma venda (simplificado)
interface Sale {
  id: string;
  clienteNome: string;
  clienteTelefone?: string;
  passeioNome: string;
  vendedorNome: string;
  dataVenda: any;
  dataPasseioRealizacao?: any;
  valorTotal: number;
  comissaoCalculada: number;
  status: 'confirmada' | 'cancelada';
  quantidade?: number;
  agenciaNome?: string;
}

// 👇 Props que o componente vai receber
interface SalesTableProps {
  sales: Sale[];                          // Vendas a serem exibidas
  sortField: string;                     // Campo atual de ordenação
  sortDir: 'asc' | 'desc';               // Direção da ordenação
  onSort: (field: string) => void;       // Função para ordenar
  isAdmin: boolean;                      // Se é admin (mostra ações)
  onEdit: (sale: Sale) => void;          // Abrir edição
  onCancel: (saleId: string, clienteNome: string) => void;  // Cancelar
  onDelete: (saleId: string, clienteNome: string) => void;  // Excluir
  deletingId: string | null;             // ID da venda sendo excluída
  cancellingId: string | null;           // ID da venda sendo cancelada
  deletingAll: boolean;                  // Se está excluindo em massa
  hasFilters: boolean;                   // Se tem filtros ativos
  onClearGlobalFilters: () => void;      // Limpar filtros globais
  onClearTableFilters: () => void;       // Limpar filtros da tabela
}

// 👇 Componente de ícone de ordenação (igual ao original)
function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: 'asc' | 'desc' }) {
  if (sortField !== field) return <span className="text-gray-300 text-xs ml-0.5">↕</span>;
  return <span className="text-blue-500 text-xs ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

// 👇 Função auxiliar para datas (igual ao original)
function safeDate(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
    return dateInput.toDate();
  }
  return new Date(dateInput);
}

export function SalesTable({
  sales,
  sortField,
  sortDir,
  onSort,
  isAdmin,
  onEdit,
  onCancel,
  onDelete,
  deletingId,
  cancellingId,
  deletingAll,
  hasFilters,
  onClearGlobalFilters,
  onClearTableFilters,
}: SalesTableProps) {

  // Se não há vendas, mostra mensagem
  if (sales.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">Nenhuma venda encontrada com os filtros atuais.</p>
          {hasFilters && (
            <div className="mt-2 flex justify-center gap-3">
              <button onClick={onClearGlobalFilters} className="text-xs text-blue-500 hover:underline">
                Limpar filtros globais
              </button>
              <button onClick={onClearTableFilters} className="text-xs text-blue-500 hover:underline">
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
      <table className="w-full">
        {/* Cabeçalho da tabela */}
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
          <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => onSort('dataVenda')}>
              Data Venda <SortIcon field="dataVenda" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-left whitespace-nowrap hidden lg:table-cell">Data Passeio</th>
            <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none" onClick={() => onSort('clienteNome')}>
              Cliente <SortIcon field="clienteNome" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden md:table-cell" onClick={() => onSort('passeioNome')}>
              Passeio <SortIcon field="passeioNome" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-left hidden md:table-cell">Agência</th>
            <th className="px-3 py-2.5 text-right hidden md:table-cell">Qtd</th>
            <th className="px-3 py-2.5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden sm:table-cell" onClick={() => onSort('valorTotal')}>
              Valor <SortIcon field="valorTotal" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none" onClick={() => onSort('comissaoCalculada')}>
              Comissão <SortIcon field="comissaoCalculada" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden lg:table-cell" onClick={() => onSort('vendedorNome')}>
              Vendedor <SortIcon field="vendedorNome" sortField={sortField} sortDir={sortDir} />
            </th>
            <th className="px-3 py-2.5 text-center">Status</th>
            {isAdmin && <th className="px-3 py-2.5 text-center">Ações</th>}
          </tr>
        </thead>

        {/* Corpo da tabela */}
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {sales.map((sale) => (
            <tr
              key={sale.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                sale.status === 'cancelada' ? 'opacity-60' : ''
              }`}
            >
              {/* Data Venda */}
              <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {formatDate(safeDate(sale.dataVenda))}
              </td>

              {/* Data Passeio */}
              <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap hidden lg:table-cell">
                {sale.dataPasseioRealizacao ? formatDate(safeDate(sale.dataPasseioRealizacao)) : '—'}
              </td>

              {/* Cliente */}
              <td className="px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-white">
                <div>{sale.clienteNome}</div>
                {sale.clienteTelefone && (
                  <div className="text-xs text-gray-400">{sale.clienteTelefone}</div>
                )}
              </td>

              {/* Passeio */}
              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[130px] hidden md:table-cell" title={sale.passeioNome}>
                {sale.passeioNome}
              </td>

              {/* Agência */}
              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                {sale.agenciaNome ? (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                    🏢 {sale.agenciaNome}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>

              {/* Quantidade */}
              <td className="px-3 py-2.5 text-sm text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                {sale.quantidade || 1}
              </td>

              {/* Valor Total */}
              <td className="px-3 py-2.5 text-sm text-right text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                {formatCurrency(sale.valorTotal)}
              </td>

              {/* Comissão */}
              <td className="px-3 py-2.5 text-sm text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                {formatCurrency(sale.comissaoCalculada)}
              </td>

              {/* Vendedor */}
              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">
                {sale.vendedorNome}
              </td>

              {/* Status */}
              <td className="px-3 py-2.5 text-center">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    sale.status === 'confirmada'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {sale.status === 'confirmada' ? '✓ Confirmada' : '✗ Cancelada'}
                </span>
              </td>

              {/* Ações (só para admin) */}
              {isAdmin && (
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(sale)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded transition-all text-xs"
                      title="Editar venda"
                    >
                      ✏️
                    </button>
                    {sale.status === 'confirmada' && (
                      <button
                        onClick={() => onCancel(sale.id, sale.clienteNome)}
                        disabled={cancellingId === sale.id}
                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 p-1.5 rounded transition-all disabled:opacity-30 text-xs"
                        title="Cancelar venda"
                      >
                        {cancellingId === sale.id ? '⏳' : '⛔'}
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(sale.id, sale.clienteNome)}
                      disabled={deletingId === sale.id || deletingAll}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-all disabled:opacity-30"
                      title="Excluir venda"
                    >
                      {deletingId === sale.id ? <span className="animate-spin inline-block text-xs">⏳</span> : '🗑️'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}