// src/App.tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { ApartmentsPage } from './pages/ApartmentsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LossesPage } from './pages/LossesPage';
import { LogPage } from './pages/LogPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { useToast } from './hooks/useToast';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [currentPage, setCurrentPage] = useState('apts');
  const { showToast, ToastContainer } = useToast();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    showToast(`Acessando ${page === 'apts' ? 'Apartamentos' : page}`, 'info');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'apts':
        return <ApartmentsPage showToast={showToast} />;
      case 'dashboard':
        return <DashboardPage showToast={showToast} />;
      case 'losses':
        return <LossesPage showToast={showToast} />;
      case 'log':
        return <LogPage showToast={showToast} />;
      case 'recibos':
        return <ReceiptsPage showToast={showToast} />;
      case 'documentos':
        return <DocumentsPage showToast={showToast} />;
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">🚧 Em construção</h2>
            <p className="text-gray-600 dark:text-gray-400">Página em desenvolvimento</p>
          </div>
        );
    }
  };

  return (
    <ThemeProvider>
      <Layout currentPage={currentPage} onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;