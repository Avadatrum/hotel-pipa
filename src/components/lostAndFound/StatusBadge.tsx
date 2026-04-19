// src/components/lostAndFound/StatusBadge.tsx

import React from 'react';
import type { ItemStatus } from '../../types/lostAndFound.types';

interface StatusBadgeProps {
  status: ItemStatus;
}

const config: Record<ItemStatus, { label: string; cls: string; dot: string }> = {
  guardado: {
    label: 'Guardado',
    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
  },
  entregue: {
    label: 'Entregue',
    cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  descartado: {
    label: 'Descartado',
    cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50',
    dot: 'bg-red-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { label, cls, dot } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};