// src/pages/lostAndFound/LostAndFoundLayout.tsx

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const tabs = [
  { to: '/achados-e-perdidos',            label: 'Itens',      emoji: '📋', end: true },
  { to: '/achados-e-perdidos/scanner',    label: 'Scanner QR', emoji: '📷', end: false },
  { to: '/achados-e-perdidos/relatorios', label: 'Relatórios', emoji: '📊', end: false },
];

export const LostAndFoundLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          🔍 Achados & Perdidos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gerencie itens encontrados no hotel
        </p>
      </div>

      {/* Sub-navegação */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`
            }
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Conteúdo da sub-rota */}
      <Outlet />
    </div>
  );
};