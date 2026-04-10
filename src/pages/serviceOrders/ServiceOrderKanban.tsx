//src/pages/serviceOrders/ServiceOrderKanban.tsx
import { useState } from 'react';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { OSKanbanBoard } from '../../components/serviceOrders/OSKanbanBoard';
import { OSFormModal } from '../../components/serviceOrders/OSFormModal';
import { OSDetailModal } from '../../components/serviceOrders/OSDetailModal';
import { OSMetrics } from '../../components/serviceOrders/OSMetrics';
import { type ServiceOrder } from '../../types/serviceOrder.types';

export function ServiceOrderKanban() {
  const { orders, loading } = useServiceOrders();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  
  const handleOrderClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };
  
  const handleOrderMove = () => {
    // O hook useServiceOrders já atualiza automaticamente via onSnapshot
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanban de Ordens de Serviço
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Arraste os cards para mover entre as colunas
          </p>
        </div>
        
        <button
          onClick={() => setShowFormModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors flex items-center gap-2 font-medium"
        >
          <span>➕</span> Nova OS
        </button>
      </div>
      
      {/* Métricas resumidas */}
      <OSMetrics orders={orders} loading={loading} />
      
      {/* Kanban Board */}
      <OSKanbanBoard
        orders={orders}
        onOrderClick={handleOrderClick}
        onOrderMove={handleOrderMove}
        loading={loading}
      />
      
      {/* Modals */}
      <OSFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={() => setShowFormModal(false)}
      />
      
      <OSDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdate={() => {
          // Refresh orders
        }}
      />
    </div>
  );
}
