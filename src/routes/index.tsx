// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/AdminRoute';
import { LoginPage } from '../pages/LoginPage';
import { ApartmentsPage } from '../pages/ApartmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogPage } from '../pages/LogPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { TabuaDeMarePage } from '../pages/TabuaDeMarePage';

import { CommissionsPage } from '../pages/commissions/CommissionsPage';
import { RegisterSalePage } from '../pages/commissions/RegisterSalePage';
import { CommissionDashboard } from '../pages/commissions/CommissionDashboard';
import { MyCommissions } from '../pages/commissions/MyCommissions';
import { AgencyManager } from '../components/commissions/AgencyManager';
import { CommissionSettings } from '../pages/commissions/CommissionSettings';
import { CommissionCharts } from '../components/commissions/CommissionCharts';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
      {
        path: 'comissoes',
        element: <CommissionsPage />,
        children: [
          { index: true, element: <RegisterSalePage /> },
          { path: 'registrar', element: <RegisterSalePage /> },
          { path: 'dashboard', element: <CommissionDashboard /> },
          { path: 'graficos', element: <CommissionCharts /> },
          { path: 'minhas-comissoes', element: <MyCommissions /> },
          { path: 'agencias', element: <AdminRoute><AgencyManager /></AdminRoute> },
          { path: 'configurar', element: <AdminRoute><CommissionSettings /></AdminRoute> },
        ],
      },
      { path: 'admin/usuarios', element: <AdminRoute><AdminUsersPage /></AdminRoute> },
    ],
  },
]);