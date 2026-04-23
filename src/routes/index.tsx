// src/routes/index.tsx
import { useState } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Components
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/AdminRoute';

// OS Components
import { OSTable } from '../components/serviceOrders/OSTable';
import { OSFormModal } from '../components/serviceOrders/OSFormModal';
import { OSDetailModal } from '../components/serviceOrders/OSDetailModal';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { ApartmentsPage } from '../pages/ApartmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogPage } from '../pages/LogPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { TabuaDeMarePage } from '../pages/TabuaDeMarePage';
import { PublicOSPage } from '../pages/PublicOSPage';
import { PublicTourPage } from '../pages/PublicTourPage';

// Lost & Found Pages
import { LostAndFoundLayout } from '../pages/lostAndFound/LostAndFoundLayout';
import { LostAndFoundListPage } from '../pages/lostAndFound/LostAndFoundListPage';
import { LostAndFoundReportsPage } from '../pages/lostAndFound/LostAndFoundReportsPage';
import { LostAndFoundScanPage } from '../pages/lostAndFound/LostAndFoundScanPage';

// Commissions Pages & Components
import { CommissionsPage } from '../pages/commissions/CommissionsPage';
import { RegisterSalePage } from '../pages/commissions/RegisterSalePage';
import { CommissionDashboard } from '../pages/commissions/CommissionDashboard';
import { MyCommissions } from '../pages/commissions/MyCommissions';
import { CommissionSettings } from '../pages/commissions/CommissionSettings';
import { AgencyManager } from '../components/commissions/AgencyManager';
import { CommissionCharts } from '../components/commissions/CommissionCharts';

// Service Orders Pages
import { ServiceOrdersPage } from '../pages/serviceOrders/ServiceOrdersPage';
import { ServiceOrderDashboard } from '../pages/serviceOrders/ServiceOrderDashboard';
import { ServiceOrderKanban } from '../pages/serviceOrders/ServiceOrderKanban';
import { ServiceOrderReports } from '../pages/serviceOrders/ServiceOrderReports';

// Hooks
import { useServiceOrders } from '../hooks/useServiceOrders';
import type { ServiceOrder } from '../types/serviceOrder.types';

// Adicionar no routes/index.tsx:
import { PublicTowelSignaturePage } from '../pages/PublicTowelSignaturePage';

// Wrapper para a lista de OS com lógica de modais
function ServiceOrderListPage() {
  const { orders, loading } = useServiceOrders();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowFormModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span> Nova OS
        </button>
      </div>

      <OSTable
        orders={orders}
        loading={loading}
        onOrderClick={(order) => {
          setSelectedOrder(order);
          setShowDetailModal(true);
        }}
        onEdit={(order) => {
          setSelectedOrder(order);
          setShowFormModal(true);
        }}
      />

      <OSFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelectedOrder(null); }}
        onSuccess={() => setShowFormModal(false)}
        editData={selectedOrder}
        mode={selectedOrder ? 'edit' : 'create'}
      />

      <OSDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onEdit={(order) => {
          setShowDetailModal(false);
          setSelectedOrder(order);
          setShowFormModal(true);
        }}
      />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/osabertas',
    element: <PublicOSPage />,
  },
  {
    path: '/passeio/:tourId',
    element: <PublicTourPage />,
  },
  {
    path: '/toalha/:aptNumber/:token',
    element: <PublicTowelSignaturePage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ApartmentsPage /> },
      { path: 'painel', element: <DashboardPage /> },
      { path: 'historico', element: <LogPage /> },
      { path: 'recibos', element: <ReceiptsPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      { path: 'tabua-de-mare', element: <TabuaDeMarePage /> },

      // ── Achados & Perdidos ──────────────────────────────────────────
      {
        path: 'achados-e-perdidos', // ← CORRIGIDO: português
        element: <LostAndFoundLayout />,
        children: [
          { index: true,        element: <LostAndFoundListPage /> },
          { path: 'relatorios', element: <LostAndFoundReportsPage /> },
          { path: 'scanner',    element: <LostAndFoundScanPage /> },
        ],
      },
      // ────────────────────────────────────────────────────────────────

      // Rotas do Sistema de OS
      {
        path: 'os',
        element: <ServiceOrdersPage />,
        children: [
          { index: true,           element: <ServiceOrderListPage /> },
          { path: 'dashboard',     element: <ServiceOrderDashboard /> },
          { path: 'kanban',        element: <ServiceOrderKanban /> },
          { path: 'relatorios',    element: <ServiceOrderReports /> },
        ],
      },

      // Rotas de Comissões
      {
        path: 'comissoes',
        element: <CommissionsPage />,
        children: [
          { index: true,                element: <RegisterSalePage /> },
          { path: 'registrar',          element: <RegisterSalePage /> },
          { path: 'dashboard',          element: <CommissionDashboard /> },
          { path: 'graficos',           element: <CommissionCharts /> },
          { path: 'minhas-comissoes',   element: <MyCommissions /> },
          { path: 'agencias',           element: <AdminRoute><AgencyManager /></AdminRoute> },
          { path: 'configurar',         element: <AdminRoute><CommissionSettings /></AdminRoute> },
        ],
      },

      { path: 'admin/usuarios', element: <AdminRoute><AdminUsersPage /></AdminRoute> },
    ],
  },
]);