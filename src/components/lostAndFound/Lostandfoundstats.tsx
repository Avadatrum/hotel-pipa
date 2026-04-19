// src/components/lostAndFound/LostAndFoundStats.tsx

import React from 'react';

interface LostAndFoundStatsProps {
  total: number;
  stored: number;
  returned: number;
  discarded: number;
}

export const LostAndFoundStats: React.FC<LostAndFoundStatsProps> = ({
  total,
  stored,
  returned,
  discarded,
}) => {
  const cards = [
    {
      label: 'Total de Itens',
      value: total,
      icon: '🗂️',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-100 dark:border-blue-900/50',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Aguardando',
      value: stored,
      icon: '📦',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900/40',
      badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Entregues',
      value: returned,
      icon: '✅',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Descartados',
      value: discarded,
      icon: '🗑️',
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-100 dark:border-red-900/40',
      badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md ${card.bg} ${card.border}`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${card.badge} shrink-0`}>
            {card.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none mb-1">
              {card.label}
            </p>
            <p className={`text-2xl font-black leading-none ${card.color}`}>
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};