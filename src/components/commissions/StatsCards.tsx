// src/components/commissions/StatsCards.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

interface Stats {
  totalVendas: number;
  totalCanceladas: number;
  totalComissoes: number;
  totalVendasValor: number;
  mediaComissao: number;
  taxaCancelamento: string;
}

/** Comissão é a métrica principal — aparece em destaque. */
export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Comissão — card principal, maior destaque */}
      <div className="col-span-2 lg:col-span-1 bg-green-600 text-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-100">Comissões do período</p>
        <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalComissoes)}</p>
        <p className="text-xs text-green-200 mt-1">Média {formatCurrency(stats.mediaComissao)} / venda</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendas confirmadas</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalVendas}</p>
        <p className="text-xs text-gray-400 mt-1">{formatCurrency(stats.totalVendasValor)} em valor</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Canceladas</p>
        <p className="text-xl font-bold text-red-500 mt-1">{stats.totalCanceladas}</p>
        <p className="text-xs text-gray-400 mt-1">Taxa {stats.taxaCancelamento}%</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Média por venda</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.mediaComissao)}</p>
        <p className="text-xs text-gray-400 mt-1">em comissão</p>
      </div>
    </div>
  );
}