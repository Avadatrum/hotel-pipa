// src/pages/commissions/CommissionsPage.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import { CommissionProvider } from '../../contexts/CommissionContext';

const BASE_TABS = [
  { id: 'register',       label: 'Registrar venda',   path: '/comissoes/registrar' },
  { id: 'dashboard',      label: 'Dashboard',          path: '/comissoes/dashboard' },
  { id: 'charts',         label: 'Gráficos',           path: '/comissoes/graficos' },
  { id: 'myCommissions',  label: 'Minhas comissões',   path: '/comissoes/minhas-comissoes' },
];

const ADMIN_TABS = [
  { id: 'agencies', label: 'Agências',        path: '/comissoes/agencias' },
  { id: 'settings', label: 'Configurações',   path: '/comissoes/configurar' },
];

export function CommissionsPage() {
  const { canManageUsers } = usePermission();
  const tabs = canManageUsers ? [...BASE_TABS, ...ADMIN_TABS] : BASE_TABS;

  return (
    <CommissionProvider>
      <div className="space-y-5">
        {/* Navegação */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex gap-0.5 min-w-max">
            {tabs.map(tab => (
              <NavLink key={tab.id} to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`
                }>
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