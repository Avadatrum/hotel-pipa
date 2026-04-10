// src/components/serviceOrders/OSKanbanCard.tsx
import { type ServiceOrder } from '../../types/serviceOrder.types';
import { OSStatusBadge } from './OSStatusBadge';
// OSPriorityBadge removido
import { getOSTipoIcon, isPrazoVencido } from '../../utils/osHelpers';

interface OSKanbanCardProps {
  order: ServiceOrder;
  onClick?: (order: ServiceOrder) => void;
  onDragStart?: (e: React.DragEvent, order: ServiceOrder) => void;
  draggable?: boolean;
}

export function OSKanbanCard({ order, onClick, onDragStart, draggable = true }: OSKanbanCardProps) {
  const prazoVencido = isPrazoVencido(order.prazo, order.status);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, order);
  };
  
  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(order)}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${prazoVencido 
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
          : 'border-gray-200 dark:border-gray-700'
        }
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
            {order.numero}
          </span>
          {/* OSPriorityBadge removido */}
        </div>
        
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
          {order.titulo}
        </h4>
        
        {/* Substituição de order.localNome por order.local */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{getOSTipoIcon(order.tipo)}</span>
          <span className="truncate">{order.local}</span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {order.descricao}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {order.solicitanteNome.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
              {order.solicitanteNome}
            </span>
          </div>
          
          {order.executorNome && (
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {order.executorNome.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <OSStatusBadge status={order.status} size="sm" />
        
        {order.prazo && (
          <span className={`
            text-xs
            ${prazoVencido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}
          `}>
            {prazoVencido ? '⚠️ Vencido' : `📅 ${new Date(order.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
          </span>
        )}
      </div>
    </div>
  );
}