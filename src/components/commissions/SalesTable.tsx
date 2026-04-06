// src/components/commissions/SalesTable.tsx
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';
import { useMemo } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';

// 👇 Tipo para uma venda
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
  quantidadePessoas?: number; // Adicionado para a lógica de exibição
  agenciaId?: string;
  agenciaNome?: string;    
  agenciaTelefone?: string; // Adicionado para o tipo enriquecido
}

// 👇 Props
interface SalesTableProps {
  sales: Sale[];                          
  sortField: string;                     
  sortDir: 'asc' | 'desc';               
  onSort: (field: string) => void;       
  isAdmin: boolean;                      
  onEdit: (sale: Sale) => void;          
  onCancel: (saleId: string, clienteNome: string) => void;  
  onDelete: (saleId: string, clienteNome: string) => void;  
  deletingId: string | null;             
  cancellingId: string | null;           
  deletingAll: boolean;                  
  hasFilters: boolean;                   
  onClearGlobalFilters: () => void;      
  onClearTableFilters: () => void;       
}

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: 'asc' | 'desc' }) {
  if (sortField !== field) return <span className="text-gray-300 text-xs ml-0.5">↕</span>;
  return <span className="text-blue-500 text-xs ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

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

  const { agencies } = useCommissions();

  const agencyMap = useMemo(() => {
    const map: Record<string, any> = {}; 
    agencies?.forEach(agency => {
      if (agency && agency.id) {
        map[agency.id] = agency;
      }
    });
    return map;
  }, [agencies]);

  const enrichedSales = useMemo(() => {
    return sales.map(sale => {
      const agency = sale.agenciaId ? agencyMap[sale.agenciaId] : null;
      
      return {
        ...sale,
        agenciaNome: sale.agenciaNome || agency?.nome,
        agenciaTelefone: agency?.telefone,
      };
    });
  }, [sales, agencyMap]);

  if (enrichedSales.length === 0) {
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

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {enrichedSales.map((sale) => (
            <tr
              key={sale.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                sale.status === 'cancelada' ? 'opacity-60' : ''
              }`}
            >
              <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {formatDate(safeDate(sale.dataVenda))}
              </td>

              <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap hidden lg:table-cell">
                {sale.dataPasseioRealizacao ? formatDate(safeDate(sale.dataPasseioRealizacao)) : '—'}
              </td>

              <td className="px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-white">
                <div>{sale.clienteNome}</div>
                {sale.clienteTelefone && (
                  <a
                    href={`https://wa.me/${sale.clienteTelefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline hover:text-blue-700 transition-colors flex items-center gap-1"
                    title="Conversar no WhatsApp"
                  >
                    <span className="text-[10px]"></span>
                    {sale.clienteTelefone}
                  </a>
                )}
              </td>

              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[130px] hidden md:table-cell" title={sale.passeioNome}>
                {sale.passeioNome}
              </td>

              {/* Agência - Nome clicável para WhatsApp */}
              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                {sale.agenciaNome && sale.agenciaTelefone ? (
                  <button
                    onClick={() => {
                      const cleanPhone = sale.agenciaTelefone!.replace(/\D/g, '');
                      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                    }}
                    className="font-medium text-gray-800 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1"
                    title="Falar com Agência no WhatsApp"
                  >
                     {sale.agenciaNome} 
                  </button>
                ) : sale.agenciaNome ? (
                  <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                     {sale.agenciaNome}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>

              <td className="px-3 py-2.5 text-sm text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                <div>
                  <div>{sale.quantidade || 1}</div>
                  {sale.quantidadePessoas && sale.quantidadePessoas > 1 && (
                    <div className="text-xs text-gray-400">
                      {sale.quantidadePessoas} pessoas
                    </div>
                  )}
                </div>
              </td>

              <td className="px-3 py-2.5 text-sm text-right text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                {formatCurrency(sale.valorTotal)}
              </td>

              <td className="px-3 py-2.5 text-sm text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                {formatCurrency(sale.comissaoCalculada)}
              </td>

              <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">
                {sale.vendedorNome}
              </td>

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