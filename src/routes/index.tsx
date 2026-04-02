// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/AdminRoute';
import { LoginPage } from '../pages/LoginPage';
import { ApartmentsPage } from '../pages/ApartmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LossesPage } from '../pages/LossesPage';
import { LogPage } from '../pages/LogPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
// Adicione o import
import { CommissionsPage } from '../pages/commissions/CommissionsPage';

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
      { path: 'comissoes', element: <CommissionsPage /> },
      { path: 'perdas', element: <LossesPage /> },
      { path: 'historico', element: <LogPage /> },
      { path: 'recibos', element: <ReceiptsPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      {
        path: 'admin/usuarios',
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
]);