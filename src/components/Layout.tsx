// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApartments } from '../hooks/useApartments';
import { useTheme } from '../contexts/ThemeContext';
import { Footer } from './Footer';
import { UserMenu } from './UserMenu';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { apartments } = useApartments();
  const { theme, toggleTheme } = useTheme();
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
    { id: 'commissions', label: 'Comissões', icon: '💰', path: '/comissoes' },
    { id: 'log', label: 'Histórico', icon: '📋', path: '/historico' },
    { id: 'recibos', label: 'Recibos', icon: '🧾', path: '/recibos' },
    { id: 'documentos', label: 'Documentos', icon: '📁', path: '/documentos' },
  ];

  const currentPageLabel = navItems.find(i => i.path === location.pathname)?.label || 'HPanel';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
      
      {/* Botão flutuante minimalista para mobile */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-xl hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white/10"
        >
          <span className="text-2xl">☰</span>
        </button>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 dark:bg-slate-950 text-white z-50
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-2xl border-r border-white/5
      `}>
        
        {/* Header da Sidebar - HPanel Branding */}
        <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center text-xl transform -rotate-3 transition-transform hover:rotate-0">
              🌴
            </div>
            <div>
              <div className="font-black text-xl tracking-tighter uppercase">
                H<span className="text-blue-500">Panel</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Hotel da Pipa</div>
            </div>
          </div>
        </div>

        {/* Widgets de Stats - Estilo Glassmorphism */}
        <div className="p-4 mx-2 my-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium tracking-wide">Ocupação</span>
              <span className="font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">{stats.occupied}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium tracking-wide">Toalhas</span>
              <span className="font-bold text-amber-400">{stats.towels}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium tracking-wide">Fichas</span>
              <span className="font-bold text-emerald-400">{stats.chips}</span>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`
                  relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className={`text-xl transition-transform duration-300 ${!isActive ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110' : 'scale-110'}`}>
                  {item.icon}
                </span>
                <span className="text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-4 bg-slate-950/50 backdrop-blur-xl border-t border-white/5 text-[11px]">
          <div className="flex justify-between items-center px-2">
            <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </span>
            
            <div className="flex gap-3">
              <button 
                onClick={toggleTheme}
                className="hover:text-white transition-all text-base"
                title="Trocar tema"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => alert("Logout")}
                className="hover:text-red-400 font-bold uppercase transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay refinado */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 animate-fade-in transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conteúdo principal */}
      <div className={`transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            
            <div className="flex items-center gap-4">
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <span className="text-xl font-light">{sidebarOpen ? '⇠' : '⇢'}</span>
                </button>
              )}
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tighter">
                {currentPageLabel}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end leading-none">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Data Atual</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </span>
              </div>
              
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
              
              <UserMenu />
            </div>
            
          </div>
        </header>

        {/* Área Principal */}
        <main className="p-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 min-h-[calc(100vh-180px)] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <Outlet />
          </div>
          <Footer />
        </main>
        
      </div>
    </div>
  );
}