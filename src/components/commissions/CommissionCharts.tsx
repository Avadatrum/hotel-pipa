// src/components/commissions/CommissionCharts.tsx
import { useEffect, useState } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';
import { formatCurrency } from '../../utils/commissionCalculations';
import type { Sale } from '../../types';

interface ChartData {
  name: string;
  valor: number;
  comissao: number;
}

export function CommissionCharts() {
  const { sales, loading } = useCommissions();
  const [salesByVendor, setSalesByVendor] = useState<ChartData[]>([]);
  const [salesByTour, setSalesByTour] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ mes: string; total: number }[]>([]);

  useEffect(() => {
    if (sales.length === 0) return;

    // Vendas por vendedor
    const vendorMap = new Map<string, { valor: number; comissao: number }>();
    sales.forEach(sale => {
      if (sale.status !== 'confirmada') return;
      const existing = vendorMap.get(sale.vendedorNome) || { valor: 0, comissao: 0 };
      vendorMap.set(sale.vendedorNome, {
        valor: existing.valor + sale.valorTotal,
        comissao: existing.comissao + sale.comissaoCalculada
      });
    });
    
    const vendorData = Array.from(vendorMap.entries())
      .map(([name, data]) => ({ name, valor: data.valor, comissao: data.comissao }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    setSalesByVendor(vendorData);

    // Vendas por tipo de passeio
    const tourMap = new Map<string, number>();
    sales.forEach(sale => {
      if (sale.status !== 'confirmada') return;
      const existing = tourMap.get(sale.passeioNome) || 0;
      tourMap.set(sale.passeioNome, existing + sale.valorTotal);
    });
    
    const tourData = Array.from(tourMap.entries())
      .map(([name, valor]) => ({ name, valor, comissao: 0 }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    setSalesByTour(tourData);

    // Dados mensais (últimos 6 meses)
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      monthMap.set(monthKey, 0);
    }
    
    sales.forEach(sale => {
      if (sale.status !== 'confirmada') return;
      const date = sale.dataVenda.toDate();
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (monthMap.has(monthKey)) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + sale.valorTotal);
      }
    });
    
    const monthly = Array.from(monthMap.entries())
      .map(([mes, total]) => ({ mes, total }))
      .reverse();
    setMonthlyData(monthly);
  }, [sales]);

  const maxVendorValue = Math.max(...salesByVendor.map(d => d.valor), 1);
  const maxTourValue = Math.max(...salesByTour.map(d => d.valor), 1);
  const maxMonthlyValue = Math.max(...monthlyData.map(d => d.total), 1);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Vendas por Vendedor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>🏆</span> Top Vendedores
        </h3>
        <div className="space-y-3">
          {salesByVendor.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma venda registrada ainda</p>
          ) : (
            salesByVendor.map(vendor => (
              <div key={vendor.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{vendor.name}</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(vendor.valor)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(vendor.valor / maxVendorValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Comissão: {formatCurrency(vendor.comissao)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gráfico de Vendas por Passeio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>🎫</span> Passeios Mais Vendidos
        </h3>
        <div className="space-y-3">
          {salesByTour.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma venda registrada ainda</p>
          ) : (
            salesByTour.map(tour => (
              <div key={tour.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                    {tour.name}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(tour.valor)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(tour.valor / maxTourValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>📈</span> Evolução Mensal
        </h3>
        {monthlyData.length === 0 || monthlyData.every(m => m.total === 0) ? (
          <p className="text-center text-gray-500 py-8">Nenhuma venda nos últimos 6 meses</p>
        ) : (
          <div className="flex items-end justify-between h-40 gap-2">
            {monthlyData.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600 cursor-pointer"
                  style={{ height: `${(month.total / maxMonthlyValue) * 100}%`, minHeight: '4px' }}
                  title={`${month.mes}: ${formatCurrency(month.total)}`}
                />
                <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {month.mes}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}