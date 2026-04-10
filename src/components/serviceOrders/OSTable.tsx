// src/components/serviceOrders/OSTable.tsx
import { useState } from 'react';
import { type ServiceOrder } from '../../types/serviceOrder.types';
import { OSStatusBadge } from './OSStatusBadge';
import { OSQuickActions } from './OSQuickActions';
import { formatOSDate, getOSTipoIcon, getOSTipoLabel } from '../../utils/osHelpers';

interface OSTableProps {
  orders: ServiceOrder[];
  onOrderClick?: (order: ServiceOrder) => void;
  onEdit?: (order: ServiceOrder) => void;
  loading?: boolean;
  showActions?: boolean;
}

type SortField = 'numero' | 'dataCriacao' | 'status';
type SortDirection = 'asc' | 'desc';

export function OSTable({ 
  orders, 
  onOrderClick, 
  onEdit, 
  loading = false,
  showActions = true 
}: OSTableProps) {
  const [sortField, setSortField] = useState<SortField>('dataCriacao');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'dataCriacao') {
      aVal = new Date(a.dataCriacao).getTime();
      bVal = new Date(b.dataCriacao).getTime();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">🔧</div>
          <p>Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-lg font-medium mb-2">Nenhuma OS encontrada</p>
          <p className="text-sm">Crie uma nova ordem de serviço para começar</p>
        </div>
      </div>
    );
  }

  // Calcula o colSpan baseado se mostra ações ou não
  const baseColSpan = 7; 
  const totalColSpan = showActions ? baseColSpan + 1 : baseColSpan;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('numero')}
              >
                OS <SortIcon field="numero" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('dataCriacao')}
              >
                Data <SortIcon field="dataCriacao" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Título/Local
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Solicitante
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Executor
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedOrders.map((order) => (
              <>
                <tr 
                  key={order.id}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer
                    ${expandedRow === order.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                  onClick={() => {
                    if (expandedRow === order.id) {
                      setExpandedRow(null);
                    } else {
                      setExpandedRow(order.id);
                      onOrderClick?.(order);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {order.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatOSDate(order.dataCriacao)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span>{getOSTipoIcon(order.tipo)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getOSTipoLabel(order.tipo)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.titulo}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📍 {order.local}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {order.solicitanteNome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {order.solicitanteNome}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.executorNome ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {order.executorNome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {order.executorNome}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OSStatusBadge status={order.status} size="sm" />
                  </td>
                  {showActions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <OSQuickActions order={order} size="sm" />
                    </td>
                  )}
                </tr>
                
                {/* Linha expandida com detalhes */}
                {expandedRow === order.id && (
                  <tr>
                    <td colSpan={totalColSpan} className="px-4 py-4 bg-gray-50 dark:bg-gray-700/30">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Descrição Completa
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.descricao}
                          </p>
                        </div>
                        
                        {order.observacoes && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              Observações
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.observacoes}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {order.prazo ? formatOSDate(order.prazo) : 'Não definido'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Equipe</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {order.equipe || '—'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Seção de Custo Estimado REMOVIDA */}
                        
                        {order.historico && order.historico.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Histórico
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {order.historico.slice(-5).map((entry) => (
                                <div key={entry.id} className="flex gap-3 text-sm">
                                  <span className="text-gray-400 text-xs">
                                    {formatOSDate(entry.data)}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {entry.descricao}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(order)}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              ✏️ Editar
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedRow(null)}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}