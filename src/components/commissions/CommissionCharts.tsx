// src/components/commissions/CommissionCharts.tsx
import { useState, useMemo } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';
import { formatCurrency, safeToDate } from '../../utils/commissionCalculations';

type Period = '3m' | '6m' | '12m';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];

export function CommissionCharts() {
  const { sales, loading } = useCommissions();
  const [period, setPeriod] = useState<Period>('6m');

  const filtered = useMemo(() => {
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
    return (sales || []).filter(s => {
      if (s.status !== 'confirmada') return false;
      try { return safeToDate(s.dataVenda) >= cutoff; } catch { return false; }
    });
  }, [sales, period]);

  // Por vendedor (ordenado por comissão)
  const byVendor = useMemo(() => {
    const map = new Map<string, { comissao: number; vendas: number }>();
    filtered.forEach(s => {
      const c = map.get(s.vendedorNome) || { comissao: 0, vendas: 0 };
      map.set(s.vendedorNome, { comissao: c.comissao + s.comissaoCalculada, vendas: c.vendas + s.valorTotal });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.comissao - a.comissao)
      .slice(0, 5);
  }, [filtered]);

  // Por passeio (ordenado por comissão)
  const byTour = useMemo(() => {
    const map = new Map<string, { comissao: number; vendas: number; qty: number }>();
    filtered.forEach(s => {
      const c = map.get(s.passeioNome) || { comissao: 0, vendas: 0, qty: 0 };
      map.set(s.passeioNome, { comissao: c.comissao + s.comissaoCalculada, vendas: c.vendas + s.valorTotal, qty: c.qty + 1 });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.comissao - a.comissao)
      .slice(0, 5);
  }, [filtered]);

  // Mensal
  const monthly = useMemo(() => {
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const map = new Map<string, { label: string; comissao: number; vendas: number }>();
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), comissao: 0, vendas: 0 });
    }
    filtered.forEach(s => {
      try {
        const d = safeToDate(s.dataVenda);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map.has(key)) {
          const c = map.get(key)!;
          map.set(key, { ...c, comissao: c.comissao + s.comissaoCalculada, vendas: c.vendas + s.valorTotal });
        }
      } catch {}
    });
    return Array.from(map.values());
  }, [filtered, period]);

  const totals = useMemo(() => ({
    comissao: filtered.reduce((s, x) => s + x.comissaoCalculada, 0),
    vendas: filtered.reduce((s, x) => s + x.valorTotal, 0),
    qty: filtered.length,
  }), [filtered]);

  const maxMonthComissao = Math.max(...monthly.map(m => m.comissao), 1);
  const maxVendorComissao = Math.max(...byVendor.map(v => v.comissao), 1);
  const maxTourComissao = Math.max(...byTour.map(t => t.comissao), 1);

  const PERIOD_OPTS: { value: Period; label: string }[] = [
    { value: '3m', label: '3 meses' },
    { value: '6m', label: '6 meses' },
    { value: '12m', label: '12 meses' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + período */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gráficos</h1>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5">
          {PERIOD_OPTS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === opt.value ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-600 text-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Comissões</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totals.comissao)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total vendas</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totals.vendas)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transações</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totals.qty}</p>
        </div>
      </div>

      {/* Evolução mensal de comissões */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Evolução das comissões</h3>
        {monthly.every(m => m.comissao === 0) ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período.</p>
        ) : (
          <>
            {/* Barras */}
            <div className="flex items-end gap-1.5 h-32 mb-1">
              {monthly.map((m, i) => {
                const pct = (m.comissao / maxMonthComissao) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatCurrency(m.comissao)}
                    </div>
                    <div className="w-full flex flex-col justify-end h-full">
                      <div className="w-full bg-green-500 hover:bg-green-600 rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Labels */}
            <div className="flex gap-1.5">
              {monthly.map((m, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-gray-400 truncate">{m.label}</div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Top vendedores por comissão */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Top vendedores — por comissão</h3>
        {byVendor.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período.</p>
        ) : (
          <div className="space-y-3">
            {byVendor.map((v, i) => (
              <div key={v.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: COLORS[i] }}>{i + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{v.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(v.comissao)}</div>
                    <div className="text-[10px] text-gray-400">{formatCurrency(v.vendas)} em vendas</div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${(v.comissao / maxVendorComissao) * 100}%`, backgroundColor: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top passeios por comissão */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Passeios e transfers — por comissão gerada</h3>
        {byTour.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período.</p>
        ) : (
          <div className="space-y-3">
            {byTour.map((t, i) => (
              <div key={t.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{t.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{t.qty}x</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0 ml-2">{formatCurrency(t.comissao)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${(t.comissao / maxTourComissao) * 100}%`, backgroundColor: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}