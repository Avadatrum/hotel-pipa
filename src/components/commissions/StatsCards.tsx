// src/components/commissions/StatsCards.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

// 👇 Primeiro: Definir a "forma" dos dados que este componente vai receber
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

// 👇 Segundo: Criar o componente que recebe esses dados
export function StatsCards({ stats }: StatsCardsProps) {
  // 👇 Terceiro: Definir os cards como um array de objetos (mais fácil de manter)
  const cards = [
    {
      label: 'Vendas Confirmadas',
      value: stats.totalVendas,
      color: 'border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      icon: '✅',
      sub: formatCurrency(stats.totalVendasValor)
    },
    {
      label: 'Canceladas',
      value: `${stats.totalCanceladas} (${stats.taxaCancelamento}%)`,
      color: 'border-red-400',
      textColor: 'text-red-600',
      icon: '❌',
      sub: null
    },
    {
      label: 'Total Comissões',
      value: formatCurrency(stats.totalComissoes),
      color: 'border-green-500',
      textColor: 'text-green-600',
      icon: '💰',
      sub: null
    },
    {
      label: 'Média por Venda',
      value: formatCurrency(stats.mediaComissao),
      color: 'border-amber-400',
      textColor: 'text-amber-600',
      icon: '📈',
      sub: null
    },
  ];

  // 👇 Quarto: Renderizar os cards (igual ao código original, mas mais limpo)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div 
          key={card.label} 
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${card.color}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{card.icon}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              {card.label}
            </p>
          </div>
          <p className={`text-lg font-bold ${card.textColor}`}>{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}