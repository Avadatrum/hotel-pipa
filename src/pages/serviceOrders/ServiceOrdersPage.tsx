//src/pages/serviceOrders/ServiceOrdersPage.tsx
//import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export function ServiceOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { id: 'list', label: 'Lista', icon: '📋', path: '/os' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/os/dashboard' },
    { id: 'kanban', label: 'Kanban', icon: '📌', path: '/os/kanban' },
    { id: 'reports', label: 'Relatórios', icon: '📈', path: '/os/relatorios' },
  ];
  
  //const currentTab = tabs.find(tab => location.pathname === tab.path) || tabs[0];
  
  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`
                flex items-center gap-2 px-6 py-3 font-medium transition-all
                ${location.pathname === tab.path
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Outlet para sub-rotas */}
      <Outlet />
    </div>
  );
}