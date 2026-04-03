// src/pages/commissions/CommissionsPage.tsx
import { useState } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { SalesRegister } from '../../components/commissions/SalesRegister';
import { CommissionDashboard } from '../../components/commissions/CommissionDashboard';
import { AgencyManager } from '../../components/commissions/AgencyManager';
import { MyCommissions } from '../../components/commissions/MyCommissions';
import { CommissionCharts } from '../../components/commissions/CommissionCharts';
import { CommissionSettings } from '../../components/commissions/CommissionSettings';
import { CommissionProvider } from '../../contexts/CommissionContext';

type TabType = 'register' | 'dashboard' | 'charts' | 'agencies' | 'settings' | 'myCommissions';

export function CommissionsPage() {
  const { canManageUsers } = usePermission();
  const [activeTab, setActiveTab] = useState<TabType>('register');

  const tabs = [
    { id: 'register', label: '📝 Registrar Venda', icon: '💰' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📈' },
    { id: 'charts', label: '📉 Gráficos', icon: '📊' },
    { id: 'myCommissions', label: '👤 Minhas Comissões', icon: '👤' },
  ];
  
  if (canManageUsers) {
    tabs.push({ id: 'agencies', label: '🏢 Agências', icon: '🏢' });
    tabs.push({ id: 'settings', label: '⚙️ Configurar Comissões', icon: '⚙️' });
  }

  return (
    <CommissionProvider>
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {activeTab === 'register' && <SalesRegister />}
        {activeTab === 'dashboard' && <CommissionDashboard />}
        {activeTab === 'charts' && <CommissionCharts />}
        {activeTab === 'agencies' && canManageUsers && <AgencyManager />}
        {activeTab === 'settings' && canManageUsers && <CommissionSettings />}
        {activeTab === 'myCommissions' && <MyCommissions />}
      </div>
    </CommissionProvider>
  );
}