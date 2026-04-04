// src/pages/commissions/CommissionsPage.tsx
import { usePermission } from '../../hooks/usePermission';
// Removemos os imports dos componentes internos, pois agora são rotas
import { Outlet, NavLink } from 'react-router-dom'; 
import { CommissionProvider } from '../../contexts/CommissionContext';

// Define os tipos de abas que existem
type TabConfig = {
  id: string;
  label: string;
  icon: string;
  path: string; // Novo: caminho da rota
};

export function CommissionsPage() {
  const { canManageUsers } = usePermission();

  // Configuração das abas com seus caminhos
  const tabs: TabConfig[] = [
    { id: 'register', label: '📝 Registrar Venda', icon: '💰', path: '/comissoes/registrar' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📈', path: '/comissoes/dashboard' },
    { id: 'charts', label: '📉 Gráficos', icon: '📊', path: '/comissoes/graficos' },
    { id: 'myCommissions', label: '👤 Minhas Comissões', icon: '👤', path: '/comissoes/minhas-comissoes' },
  ];
  
  if (canManageUsers) {
    tabs.push({ id: 'agencies', label: '🏢 Agências', icon: '🏢', path: '/comissoes/agencias' });
    tabs.push({ id: 'settings', label: '⚙️ Configurar Comissões', icon: '⚙️', path: '/comissoes/configurar' });
  }

  return (
    <CommissionProvider>
      <div className="space-y-6">
        {/* Menu de Abas */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              // NavLink é melhor que Link pois ele adiciona a classe ativa automaticamente se quisermos
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) => `
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${isActive 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* 
           O Outlet é o lugar onde o React Router vai renderizar o componente da rota filha.
           Ex: Se a URL for /comissoes/dashboard, o <CommissionDashboard /> vai aparecer aqui.
        */}
        <Outlet />
      </div>
    </CommissionProvider>
  );
}