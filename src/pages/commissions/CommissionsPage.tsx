// src/pages/commissions/CommissionsPage.tsx
import { usePermission } from '../../hooks/usePermission';
import { Outlet, NavLink } from 'react-router-dom';
import { CommissionProvider } from '../../contexts/CommissionContext';

type TabConfig = {
  id: string;
  label: string;
  path: string;
};

export function CommissionsPage() {
  const { canManageUsers } = usePermission();

  const tabs: TabConfig[] = [
    { id: 'register', label: 'Registrar venda', path: '/comissoes/registrar' },
    { id: 'dashboard', label: 'Dashboard', path: '/comissoes/dashboard' },
    { id: 'charts', label: 'Gráficos', path: '/comissoes/graficos' },
    { id: 'myCommissions', label: 'Minhas comissões', path: '/comissoes/minhas-comissoes' },
  ];

  if (canManageUsers) {
    tabs.push({ id: 'agencies', label: 'Agências', path: '/comissoes/agencias' });
    tabs.push({ id: 'settings', label: 'Configurações', path: '/comissoes/configurar' });
  }

  return (
    <CommissionProvider>
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1 flex-wrap">
            {tabs.map(tab => (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Outlet />
      </div>
    </CommissionProvider>
  );
}