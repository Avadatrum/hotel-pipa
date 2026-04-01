// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ApartmentsPage } from '../pages/ApartmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LossesPage } from '../pages/LossesPage';
import { LogPage } from '../pages/LogPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { DocumentsPage } from '../pages/DocumentsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ApartmentsPage />,
      },
      {
        path: 'painel',
        element: <DashboardPage />,
      },
      {
        path: 'perdas',
        element: <LossesPage />,
      },
      {
        path: 'historico',
        element: <LogPage />,
      },
      {
        path: 'recibos',
        element: <ReceiptsPage />,
      },
      {
        path: 'documentos',
        element: <DocumentsPage />,
      },
    ],
  },
]);