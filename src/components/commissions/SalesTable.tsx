// src/components/commissions/SalesTable.tsx
import { useMemo } from 'react';
import { formatCurrency, formatDate, safeToDate } from '../../utils/commissionCalculations';
import { useCommissions } from '../../contexts/CommissionContext';
import { communicationTourService } from '../../services/communicationTourService';
import type { Sale } from '../../types/commission.types';

interface EnrichedSale extends Sale { agenciaTelefone?: string; }

interface Props {
  sales: Sale[];
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
  isAdmin: boolean;
  onEdit: (s: Sale) => void;
  onCancel: (id: string, nome: string) => void;
  onDelete: (id: string, nome: string) => void;
  deletingId: string | null;
  cancellingId: string | null;
  deletingAll: boolean;
  hasFilters: boolean;
  onClearGlobalFilters: () => void;
  onClearTableFilters: () => void;
  // 🆕 Props para seleção
  selectedSales?: Set<string>;
  onSelectSale?: (saleId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

function Th({ label, field, sortField, sortDir, onSort, className = '' }: {
  label: string; field?: string; sortField: string; sortDir: 'asc' | 'desc';
  onSort: (f: string) => void; className?: string;
}) {
  const active = field && sortField === field;
  return (
    <th className={`px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap ${field ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''} ${className}`}
      onClick={() => field && onSort(field)}>
      {label}{field && <span className="ml-1 opacity-60">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>}
    </th>
  );
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
  selectedSales = new Set(), // 🆕
  onSelectSale, // 🆕
  onSelectAll // 🆕
}: Props) {
  const { agencies } = useCommissions();

  const agencyMap = useMemo(() => {
    const m: Record<string, any> = {};
    agencies?.forEach(a => { if (a.id) m[a.id] = a; });
    return m;
  }, [agencies]);

  const enriched: EnrichedSale[] = useMemo(() =>
    sales.map(s => ({ 
      ...s, 
      agenciaNome: s.agenciaNome || agencyMap[s.agenciaId || '']?.nome, 
      agenciaTelefone: agencyMap[s.agenciaId || '']?.telefone 
    })),
    [sales, agencyMap]
  );

  // 🆕 Verificar se todas as vendas pendentes estão selecionadas
  const pendingSales = useMemo(() => 
  enriched.filter(s => s.status === 'confirmada' && 
                       (s.paymentStatus === 'pending' || !s.paymentStatus)),
  [enriched]
);
  
  const allPendingSelected = pendingSales.length > 0 && 
    pendingSales.every(s => selectedSales.has(s.id));

  const handleResendAgency = (sale: EnrichedSale) => {
    if (!sale.agenciaId || !sale.agenciaTelefone) return;
    const saleWithDetails = { ...sale, agencyData: agencyMap[sale.agenciaId!] };
    communicationTourService.sendAgencyReport(saleWithDetails as any, sale.agenciaTelefone);
  };

  const handleResendGuest = (sale: EnrichedSale) => {
    if (!sale.clienteTelefone) return;
    communicationTourService.sendGuestConfirmation(sale as any, sale.clienteTelefone);
  };

  if (enriched.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-4xl mb-3 opacity-30">◎</p>
        <p className="text-sm">Nenhuma venda encontrada.</p>
        {hasFilters && (
          <div className="mt-3 flex justify-center gap-4">
            <button onClick={onClearGlobalFilters} className="text-xs text-blue-500 hover:underline">Limpar filtros</button>
            <button onClick={onClearTableFilters} className="text-xs text-blue-500 hover:underline">Limpar busca</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
          <tr>
            {/* 🆕 Checkbox para selecionar todos */}
            {isAdmin && onSelectAll && (
              <th className="pl-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            <Th label="Data" field="dataVenda" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-left pl-4" />
            <Th label="Cliente" field="clienteNome" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-left" />
            <Th label="Passeio" field="passeioNome" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-left hidden md:table-cell" />
            <Th label="Pax" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-center hidden lg:table-cell" />
            <Th label="Valor" field="valorTotal" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right hidden sm:table-cell" />
            <Th label="Comissão" field="comissaoCalculada" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
            <Th label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-center" />
            <Th label="Pagamento" field="paymentStatus" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-center" />
            <Th label="" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {enriched.map(sale => {
            const isPending = sale.status === 'confirmada' && 
                  (sale.paymentStatus === 'pending' || !sale.paymentStatus);
            const isSelected = selectedSales.has(sale.id);
            
            return (
              <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${sale.status === 'cancelada' ? 'opacity-50' : ''}`}>
                {/* 🆕 Checkbox de seleção */}
                {isAdmin && onSelectSale && (
                  <td className="pl-4 py-3">
                    {isPending ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => onSelectSale(sale.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                )}
                
                {/* Data */}
                <td className="pl-4 pr-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(safeToDate(sale.dataVenda))}
                </td>

                {/* Cliente */}
                <td className="px-3 py-3">
                  <div className="font-medium text-gray-800 dark:text-white text-sm">{sale.clienteNome}</div>
                  {sale.clienteTelefone && (
                    <div className="text-xs text-gray-400 mt-0.5">{sale.clienteTelefone}</div>
                  )}
                  {sale.agenciaNome && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{sale.agenciaNome}</div>
                  )}
                </td>

                {/* Passeio */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{sale.passeioNome}</div>
                  {sale.dataPasseioRealizacao && (
                    <div className="text-xs text-gray-400 mt-0.5">{String(sale.dataPasseioRealizacao).substring(0, 10)}</div>
                  )}
                </td>

                {/* Pax */}
                <td className="px-3 py-3 text-center text-sm text-gray-500 hidden lg:table-cell">
                  <div>{sale.quantidadePessoas || sale.quantidade || 1}</div>
                  {(sale.quantidade || 1) > 1 && <div className="text-xs text-gray-400">{sale.quantidade}x</div>}
                </td>

                {/* Valor */}
                <td className="px-3 py-3 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                  {formatCurrency(sale.valorTotal)}
                </td>

                {/* Comissão — DESTAQUE */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.comissaoCalculada)}</span>
                </td>

                {/* Status */}
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${sale.status === 'confirmada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {sale.status === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                  </span>
                </td>

                {/* 🆕 Status do Pagamento */}
                <td className="px-3 py-3 text-center">
                  {sale.status === 'confirmada' ? (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${sale.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                      {sale.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>

                {/* Ações */}
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Reenviar para agência */}
                    {sale.agenciaId && sale.agenciaTelefone && (
                      <button onClick={() => handleResendAgency(sale)} title="Reenviar relatório à agência"
                        className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors flex items-center justify-center text-xs font-bold"
                        aria-label="Reenviar agência">A</button>
                    )}
                    {/* Reenviar para cliente */}
                    {sale.clienteTelefone && (
                      <button onClick={() => handleResendGuest(sale)} title="Reenviar confirmação ao hóspede"
                        className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors flex items-center justify-center text-xs font-bold"
                        aria-label="Reenviar hóspede">H</button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => onEdit(sale)} title="Editar"
                          className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center justify-center text-xs">✏</button>
                        {sale.status === 'confirmada' && (
                          <button onClick={() => onCancel(sale.id, sale.clienteNome)} disabled={cancellingId === sale.id} title="Cancelar"
                            className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors flex items-center justify-center text-xs disabled:opacity-30">⊘</button>
                        )}
                        <button onClick={() => onDelete(sale.id, sale.clienteNome)} disabled={deletingId === sale.id || deletingAll} title="Excluir"
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 transition-colors flex items-center justify-center text-xs disabled:opacity-30">✕</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}