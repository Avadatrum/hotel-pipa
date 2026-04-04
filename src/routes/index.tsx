// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/AdminRoute';
import { LoginPage } from '../pages/LoginPage';
import { ApartmentsPage } from '../pages/ApartmentsPage';
import { DashboardPage } from '../pages/DashboardPage'; // Cuidado: nome conflitante com comissão
import { LossesPage } from '../pages/LossesPage';
import { LogPage } from '../pages/LogPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';

// Importamos o "Layout" das comissões e as páginas filhas
import { CommissionsPage } from '../pages/commissions/CommissionsPage';
import { RegisterSalePage } from '../pages/commissions/RegisterSalePage';

// Importe as outras páginas de comissão que você tem (Dashboard, Gráficos, etc)
import { CommissionDashboard } from '../components/commissions/CommissionDashboard';
import { CommissionCharts } from '../components/commissions/CommissionCharts';
import { MyCommissions } from '../components/commissions/MyCommissions';
import { AgencyManager } from '../components/commissions/AgencyManager';
import { CommissionSettings } from '../components/commissions/CommissionSettings';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout /> {/* Este é o Layout GERAL (Menu Lateral do site todo) */}
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ApartmentsPage /> },
      
      // Mantenha o Dashboard geral separado se for diferente do de comissões
      { path: 'painel', element: <DashboardPage /> }, 
      
      { path: 'perdas', element: <LossesPage /> },
      { path: 'historico', element: <LogPage /> },
      { path: 'recibos', element: <ReceiptsPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      
      // --- AQUI ESTÁ A MUDANÇA NAS COMISSÕES ---
      {
        path: 'comissoes',
        element: <CommissionsPage />, // Aqui entra o menu de abas das comissões
        children: [
          // Redireciona /comissoes para /comissoes/registrar
          { index: true, element: <RegisterSalePage /> }, 
          
          // As rotas filhas serão renderizadas DENTRO do CommissionsPage (no <Outlet />)
          { path: 'registrar', element: <RegisterSalePage /> },
          { path: 'dashboard', element: <CommissionDashboard /> },
          { path: 'graficos', element: <CommissionCharts /> },
          { path: 'minhas-comissoes', element: <MyCommissions /> },
          
          // Rotas protegidas (Admin/Manager)
          { 
            path: 'agencias', 
            element: (
              <AdminRoute>
                <AgencyManager />
              </AdminRoute>
            ) 
          },
          { 
            path: 'configurar', 
            element: (
              <AdminRoute>
                <CommissionSettings />
              </AdminRoute>
            ) 
          },
        ],
      },
      // ---------------------------------------

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