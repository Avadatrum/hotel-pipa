// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApartments } from '../hooks/useApartments';
import { useTheme } from '../contexts/ThemeContext';
import { Footer } from './Footer';
import { UserMenu } from './UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { apartments } = useApartments();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { canManageUsers } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = {
    occupied: Object.values(apartments).filter(apt => apt.occupied).length,
    towels: Object.values(apartments).reduce((sum, apt) => sum + apt.towels, 0),
    chips: Object.values(apartments).reduce((sum, apt) => sum + apt.chips, 0),
  };

  const navItems = [
    { id: 'apts', label: 'Apartamentos', icon: '🏨', path: '/' },
    { id: 'dashboard', label: 'Painel', icon: '📊', path: '/painel' },
    { id: 'losses', label: 'Perdas', icon: '⚠️', path: '/perdas' },
    { id: 'log', label: 'Histórico', icon: '📋', path: '/historico' },
    { id: 'recibos', label: 'Recibos', icon: '🧾', path: '/recibos' },
    { id: 'documentos', label: 'Documentos', icon: '📁', path: '/documentos' },
  ];

  const currentPageLabel = navItems.find(i => i.path === location.pathname)?.label || 'Hotel da Pipa';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Botão flutuante para abrir menu no mobile */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-blue-900 dark:bg-gray-800 text-white z-50
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-xl overflow-y-auto
      `}>
        <div className="p-5 border-b border-blue-800 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-xl">
              🌴
            </div>
            <div>
              <div className="font-bold text-base">Hotel da Pipa</div>
              <div className="text-xs text-blue-300 dark:text-gray-400">Sistema de Gestão</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-blue-800 dark:border-gray-700 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-300 dark:text-gray-400">Ocupados</span>
            <span className="font-bold">{stats.occupied}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300 dark:text-gray-400">Toalhas</span>
            <span className="font-bold text-yellow-300">{stats.towels}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300 dark:text-gray-400">Fichas</span>
            <span className="font-bold text-green-300">{stats.chips}</span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                transition-colors duration-200
                ${location.pathname === item.path 
                  ? 'bg-blue-800 dark:bg-gray-700 text-white' 
                  : 'text-blue-200 dark:text-gray-300 hover:bg-blue-800 dark:hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800 dark:border-gray-700 text-xs text-blue-300 dark:text-gray-400">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
            <div className="flex gap-3">
              <button 
                onClick={toggleTheme}
                className="hover:text-white transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => alert("Logout")}
                className="hover:text-white transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conteúdo principal */}
      <div className={`transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ☰
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                {currentPageLabel}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
              <button 
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="p-4">
          <Outlet /> {/* Aqui as páginas serão renderizadas */}
          <Footer />
        </main>
      </div>
    </div>
  );
}