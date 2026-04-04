// src/components/commissions/CommissionCharts.tsx
import { useState, useMemo } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';
import { formatCurrency } from '../../utils/commissionCalculations';

interface ChartData {
  name: string;
  valor: number;
  comissao: number;
}

type Period = '3m' | '6m' | '12m';

export function CommissionCharts() {
  const { sales, loading } = useCommissions();
  const [period, setPeriod] = useState<Period>('6m');

  // Filtra vendas confirmadas pelo período selecionado
  const filteredSales = useMemo(() => {
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return (sales || []).filter(s => {
      if (s.status !== 'confirmada') return false;
      try {
        return s.dataVenda.toDate() >= cutoff;
      } catch {
        return false;
      }
    });
  }, [sales, period]);

  // Top vendedores
  const salesByVendor = useMemo<ChartData[]>(() => {
    const map = new Map<string, { valor: number; comissao: number }>();
    filteredSales.forEach(sale => {
      const cur = map.get(sale.vendedorNome) || { valor: 0, comissao: 0 };
      map.set(sale.vendedorNome, {
        valor: cur.valor + sale.valorTotal,
        comissao: cur.comissao + sale.comissaoCalculada
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, valor: d.valor, comissao: d.comissao }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filteredSales]);

  // Top passeios
  const salesByTour = useMemo<ChartData[]>(() => {
    const map = new Map<string, { valor: number; comissao: number; qty: number }>();
    filteredSales.forEach(sale => {
      const cur = map.get(sale.passeioNome) || { valor: 0, comissao: 0, qty: 0 };
      map.set(sale.passeioNome, {
        valor: cur.valor + sale.valorTotal,
        comissao: cur.comissao + sale.comissaoCalculada,
        qty: cur.qty + (sale.quantidade || 1)
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, valor: d.valor, comissao: d.comissao }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filteredSales]);

  // Evolução mensal
  const monthlyData = useMemo(() => {
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const map = new Map<string, { vendas: number; comissao: number; key: string }>();
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      map.set(key, { vendas: 0, comissao: 0, key: label });
    }
    filteredSales.forEach(sale => {
      try {
        const date = sale.dataVenda.toDate();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (map.has(key)) {
          const cur = map.get(key)!;
          map.set(key, {
            ...cur,
            vendas: cur.vendas + sale.valorTotal,
            comissao: cur.comissao + sale.comissaoCalculada
          });
        }
      } catch {}
    });
    return Array.from(map.values());
  }, [filteredSales, period]);

  // Totais gerais para summary cards
  const totals = useMemo(() => ({
    vendas: filteredSales.reduce((s, x) => s + x.valorTotal, 0),
    comissoes: filteredSales.reduce((s, x) => s + x.comissaoCalculada, 0),
    qtd: filteredSales.length
  }), [filteredSales]);

  const maxVendorValue = Math.max(...salesByVendor.map(d => d.valor), 1);
  const maxTourValue = Math.max(...salesByTour.map(d => d.valor), 1);
  const maxMonthlyValue = Math.max(...monthlyData.map(d => d.vendas), 1);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Seletor de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">📊 Análise de Desempenho</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
          {(['3m', '6m', '12m'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {p === '3m' ? '3 meses' : p === '6m' ? '6 meses' : '12 meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(totals.vendas)}
          </div>
          <div className="text-xs text-blue-500">Total Vendas</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totals.comissoes)}
          </div>
          <div className="text-xs text-green-500">Comissões</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {totals.qtd}
          </div>
          <div className="text-xs text-purple-500">Transações</div>
        </div>
      </div>

      {/* Evolução Mensal — Gráfico de barras melhorado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          📈 Evolução Mensal
        </h3>
        {monthlyData.every(m => m.vendas === 0) ? (
          <p className="text-center text-gray-400 py-10 text-sm">Nenhuma venda no período selecionado</p>
        ) : (
          <div className="space-y-2">
            {/* Barras verticais com valores */}
            <div className="flex items-end gap-1.5 h-36">
              {monthlyData.map((month, idx) => {
                const pct = (month.vendas / maxMonthlyValue) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex flex-col justify-end" style={{ height: '120px' }}>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatCurrency(month.vendas)}
                      </div>
                      <div
                        className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-500 cursor-default"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Labels meses */}
            <div className="flex gap-1.5">
              {monthlyData.map((month, idx) => (
                <div key={idx} className="flex-1 text-center text-xs text-gray-400 truncate">
                  {month.key}
                </div>
              ))}
            </div>
            {/* Legenda comissão */}
            <div className="flex items-end gap-1.5 mt-1">
              {monthlyData.map((month, idx) => {
                const pct = (month.comissao / maxMonthlyValue) * 100;
                return (
                  <div key={idx} className="flex-1 group">
                    <div className="relative" style={{ height: '32px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-green-400/60 rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={`Comissão: ${formatCurrency(month.comissao)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Vendas</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-400/60 rounded-sm inline-block" /> Comissões</div>
            </div>
          </div>
        )}
      </div>

      {/* Top Vendedores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          🏆 Top Vendedores
        </h3>
        {salesByVendor.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="space-y-3">
            {salesByVendor.map((vendor, idx) => (
              <div key={vendor.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: COLORS[idx] }}>
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[140px]">
                      {vendor.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800 dark:text-white text-xs">
                      {formatCurrency(vendor.valor)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +{formatCurrency(vendor.comissao)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${(vendor.valor / maxVendorValue) * 100}%`,
                      backgroundColor: COLORS[idx]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Passeios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          🎫 Passeios Mais Vendidos
        </h3>
        {salesByTour.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="space-y-3">
            {salesByTour.map((tour, idx) => (
              <div key={tour.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 dark:text-gray-200 truncate max-w-[60%]">{tour.name}</span>
                  <span className="font-semibold text-gray-800 dark:text-white text-xs">
                    {formatCurrency(tour.valor)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${(tour.valor / maxTourValue) * 100}%`,
                      backgroundColor: COLORS[idx]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
