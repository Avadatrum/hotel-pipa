// src/pages/serviceOrders/ServiceOrderDashboard.tsx
import { useState } from 'react';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { OSMetrics } from '../../components/serviceOrders/OSMetrics';
import { OSCharts } from '../../components/serviceOrders/OSCharts';
import { OSTable } from '../../components/serviceOrders/OSTable';
import { OSFormModal } from '../../components/serviceOrders/OSFormModal';
import { OSDetailModal } from '../../components/serviceOrders/OSDetailModal';
import { type ServiceOrder } from '../../types/serviceOrder.types';

export function ServiceOrderDashboard() {
  const { orders, loading } = useServiceOrders(); // getStatistics removido daqui também
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  
  // const statistics = getStatistics(); -> VARIÁVEL REMOVIDA AQUI
  
  // Últimas 5 OS
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
    .slice(0, 5);
  
  const handleOrderClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };
  
  const handleEdit = (order: ServiceOrder) => {
    setEditingOrder(order);
    setShowFormModal(true);
  };
  
  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingOrder(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Ordens de Serviço
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visão geral de todas as ordens de serviço
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
      
      {/* Métricas */}
      <OSMetrics orders={orders} loading={loading} />
      
      {/* Gráficos */}
      <OSCharts orders={orders} loading={loading} />
      
      {/* OS Recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            OS Recentes
          </h2>
          <button
            onClick={() => window.location.href = '/os/list'}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver todas →
          </button>
        </div>
        
        <OSTable
          orders={recentOrders}
          onOrderClick={handleOrderClick}
          onEdit={handleEdit}
          loading={loading}
        />
      </div>
      
      {/* Modals */}
      <OSFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingOrder(null);
        }}
        onSuccess={handleFormSuccess}
        editData={editingOrder}
        mode={editingOrder ? 'edit' : 'create'}
      />
      
      <OSDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onEdit={handleEdit}
        onUpdate={() => {
          // Refresh orders
        }}
      />
    </div>
  );
}