// src/components/serviceOrders/OSKanbanBoard.tsx
import { useState } from 'react';
import { type ServiceOrder, type OSStatus, OS_STATUS } from '../../types/serviceOrder.types';
import { OSKanbanCard } from './OSKanbanCard';
import { updateServiceOrder, addOSComment } from '../../services/serviceOrderService';
import { useToast } from '../../hooks/useToast';

interface OSKanbanBoardProps {
  orders: ServiceOrder[];
  onOrderClick?: (order: ServiceOrder) => void;
  onOrderMove?: (orderId: string, newStatus: OSStatus) => void;
  loading?: boolean;
}

interface KanbanColumn {
  status: OSStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function OSKanbanBoard({ orders, onOrderClick, onOrderMove, loading = false }: OSKanbanBoardProps) {
  const { showToast } = useToast();
  const [draggedOrder, setDraggedOrder] = useState<ServiceOrder | null>(null);
  const [dropTarget, setDropTarget] = useState<OSStatus | null>(null);
  
  const columns: KanbanColumn[] = OS_STATUS.map(status => ({
    status: status.value,
    title: status.label,
    color: status.color,
    bgColor: status.bgColor,
    borderColor: status.value === 'aberta' ? 'border-blue-300 dark:border-blue-700' :
                status.value === 'em_andamento' ? 'border-yellow-300 dark:border-yellow-700' :
                status.value === 'concluida' ? 'border-green-300 dark:border-green-700' :
                'border-gray-300 dark:border-gray-700'
  }));
  
  const getOrdersByStatus = (status: OSStatus) => {
    return orders.filter(order => order.status === status);
  };
  
  const handleDragStart = (_e: React.DragEvent, order: ServiceOrder) => {
    setDraggedOrder(order);
  };
  
  // CORREÇÃO APLICADA AQUI
  const handleDragOver = (_e: React.DragEvent, status: OSStatus) => {
    _e.preventDefault(); 
    setDropTarget(status);
  };
  
  const handleDragLeave = () => {
    setDropTarget(null);
  };
  
  const handleDrop = async (e: React.DragEvent, newStatus: OSStatus) => {
    e.preventDefault();
    setDropTarget(null);
    
    if (!draggedOrder) return;
    if (draggedOrder.status === newStatus) return;
    
    try {
      await updateServiceOrder(draggedOrder.id, { status: newStatus });
      
      const statusMessages: Record<OSStatus, string> = {
        aberta: 'OS movida para "Em Aberto"',
        em_andamento: 'OS movida para "Em Andamento"',
        concluida: 'OS concluída',
        cancelada: 'OS cancelada'
      };
      
      await addOSComment(draggedOrder.id, 'Movimentação', statusMessages[newStatus]);
      
      onOrderMove?.(draggedOrder.id, newStatus);
      showToast(`OS ${draggedOrder.numero} movida para "${columns.find(c => c.status === newStatus)?.title}"`, 'success');
    } catch (error) {
      showToast('Erro ao mover OS', 'error');
    } finally {
      setDraggedOrder(null);
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(column => {
        const columnOrders = getOrdersByStatus(column.status);
        const isDropTarget = dropTarget === column.status;
        
        return (
          <div
            key={column.status}
            className={`
              bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 transition-all duration-200
              ${column.borderColor}
              ${isDropTarget ? 'ring-2 ring-blue-400 dark:ring-blue-600 scale-[1.02]' : ''}
            `}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${column.status === 'aberta' ? 'bg-blue-500' : ''}
                    ${column.status === 'em_andamento' ? 'bg-yellow-500' : ''}
                    ${column.status === 'concluida' ? 'bg-green-500' : ''}
                    ${column.status === 'cancelada' ? 'bg-gray-500' : ''}
                    ${column.status === 'em_andamento' ? 'animate-pulse' : ''}
                  `} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {columnOrders.length}
                </span>
              </div>
            </div>
            
            {/* Column Content */}
            <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
              {columnOrders.length === 0 ? (
                <div className={`
                  text-center py-8 px-4 rounded-lg border-2 border-dashed
                  ${isDropTarget 
                    ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                  }
                  transition-all duration-200
                `}>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {isDropTarget ? 'Solte aqui para mover' : 'Nenhuma OS'}
                  </p>
                </div>
              ) : (
                columnOrders.map(order => (
                  <OSKanbanCard
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
              
              {/* Drop indicator */}
              {isDropTarget && columnOrders.length > 0 && (
                <div className="border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
                    Solte aqui para mover para "{column.title}"
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}