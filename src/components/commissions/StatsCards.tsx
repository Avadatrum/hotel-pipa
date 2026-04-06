// src/components/commissions/StatsCards.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

interface StatsCardsProps {
  stats: {
    totalVendas: number;
    totalCanceladas: number;
    totalComissoes: number;
    totalVendasValor: number;
    mediaComissao: number;
    taxaCancelamento: string;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Vendas confirmadas',
      value: stats.totalVendas,
      color: 'border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      sub: formatCurrency(stats.totalVendasValor),
    },
    {
      label: 'Canceladas',
      value: `${stats.totalCanceladas} (${stats.taxaCancelamento}%)`,
      color: 'border-red-400',
      textColor: 'text-red-600 dark:text-red-400',
      sub: null,
    },
    {
      label: 'Total de comissões',
      value: formatCurrency(stats.totalComissoes),
      color: 'border-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      sub: null,
    },
    {
      label: 'Média por venda',
      value: formatCurrency(stats.mediaComissao),
      color: 'border-amber-400',
      textColor: 'text-amber-600 dark:text-amber-400',
      sub: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${card.color}`}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
            {card.label}
          </p>
          <p className={`text-lg font-bold ${card.textColor}`}>{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}