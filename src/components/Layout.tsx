// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useApartments } from '../hooks/useApartments';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { apartments } = useApartments();

  // Detectar mudança de tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Se for desktop, abre o sidebar automaticamente
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

  // Fechar sidebar ao clicar em um link no mobile
  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Calcular estatísticas
  const stats = {
    occupied: Object.values(apartments).filter(apt => apt.occupied).length,
    towels: Object.values(apartments).reduce((sum, apt) => sum + apt.towels, 0),
    chips: Object.values(apartments).reduce((sum, apt) => sum + apt.chips, 0),
  };

  const navItems = [
    { id: 'apts', label: 'Apartamentos', icon: '🏨' },
    { id: 'dashboard', label: 'Painel', icon: '📊' },
    { id: 'losses', label: 'Perdas', icon: '⚠️' },
    { id: 'log', label: 'Histórico', icon: '📋' },
    { id: 'recibos', label: 'Recibos', icon: '🧾' },
    { id: 'documentos', label: 'Documentos', icon: '📁' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
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
        fixed top-0 left-0 h-full w-64 bg-blue-900 text-white z-50
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-xl overflow-y-auto
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-xl">
              🌴
            </div>
            <div>
              <div className="font-bold text-base">Hotel da Pipa</div>
              <div className="text-xs text-blue-300">Sistema de Gestão</div>
            </div>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="p-4 border-b border-blue-800 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-300">Ocupados</span>
            <span className="font-bold">{stats.occupied}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Toalhas</span>
            <span className="font-bold text-yellow-300">{stats.towels}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Fichas</span>
            <span className="font-bold text-green-300">{stats.chips}</span>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                transition-colors duration-200
                ${currentPage === item.id 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800 text-xs text-blue-300">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
            <button 
              onClick={() => alert("Logout")}
              className="hover:text-white transition-colors"
            >
              Sair
            </button>
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
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ☰
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-800">
                {navItems.find(i => i.id === currentPage)?.label || 'Hotel da Pipa'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:block">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
              <button 
                onClick={() => {
                  // Função para tema (opcional)
                  alert('Tema será implementado em breve')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                🌙
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}