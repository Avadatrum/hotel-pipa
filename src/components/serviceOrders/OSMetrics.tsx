// src/components/serviceOrders/OSMetrics.tsx
import { useMemo } from 'react';
import { type ServiceOrder } from '../../types/serviceOrder.types';
import { calculateOSMetrics } from '../../utils/osHelpers';

interface OSMetricsProps {
  orders: ServiceOrder[];
  loading?: boolean;
}

export function OSMetrics({ orders, loading = false }: OSMetricsProps) {
  const metrics = useMemo(() => calculateOSMetrics(orders), [orders]);
  
  const cards = [
    {
      title: 'Total de OS',
      value: metrics.total,
      icon: '📋',
      color: 'blue',
      subtext: `${metrics.thisMonth || metrics.abertas + metrics.emAndamento} este mês`
    },
    {
      title: 'Em Aberto',
      value: metrics.abertas,
      icon: '🔴',
      color: 'red',
      subtext: 'Aguardando início'
    },
    {
      title: 'Em Andamento',
      value: metrics.emAndamento,
      icon: '🟡',
      color: 'yellow',
      subtext: 'Em execução'
    },
    {
      title: 'Concluídas',
      value: metrics.concluidas,
      icon: '✅',
      color: 'green',
      subtext: `${metrics.total > 0 ? Math.round((metrics.concluidas / metrics.total) * 100) : 0}% do total`
    },
    {
      title: 'Tempo Médio',
      value: metrics.tempoMedioConclusao > 0 ? `${metrics.tempoMedioConclusao}h` : '—',
      icon: '⏱️',
      color: 'purple',
      subtext: 'Para conclusão'
    }
    // Card "Alta Prioridade" REMOVIDO
  ];
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300',
      value: 'text-blue-900 dark:text-blue-100'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300',
      value: 'text-red-900 dark:text-red-100'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300',
      value: 'text-yellow-900 dark:text-yellow-100'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300',
      value: 'text-green-900 dark:text-green-100'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300',
      value: 'text-purple-900 dark:text-purple-100'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300',
      value: 'text-orange-900 dark:text-orange-100'
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            ${colorClasses[card.color as keyof typeof colorClasses].bg}
            border ${colorClasses[card.color as keyof typeof colorClasses].border}
            rounded-xl p-4 transition-all duration-200 hover:shadow-md
          `}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-lg
              ${colorClasses[card.color as keyof typeof colorClasses].icon}
            `}>
              {card.icon}
            </div>
          </div>
          
          <div className={`
            text-2xl font-bold mb-1
            ${colorClasses[card.color as keyof typeof colorClasses].value}
          `}>
            {card.value}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {card.subtext}
          </div>
        </div>
      ))}
    </div>
  );
}