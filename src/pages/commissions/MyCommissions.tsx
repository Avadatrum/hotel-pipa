// src/pages/commissions/MyCommissions.tsx
import { useMemo, useState } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, safeToDate } from '../../utils/commissionCalculations';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales, loading } = useCommissions();
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');

  const mySales = useMemo(() => {
    const now = new Date();
    return (sales || [])
      .filter(s => {
        if (s.vendedorId !== user?.id) return false;
        if (period === 'all') return true;
        const days = parseInt(period);
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return safeToDate(s.dataVenda) >= cutoff;
      })
      .sort((a, b) => safeToDate(b.dataVenda).getTime() - safeToDate(a.dataVenda).getTime());
  }, [sales, user, period]);

  const confirmadas = useMemo(() => mySales.filter(s => s.status === 'confirmada'), [mySales]);
  const totalComissao = useMemo(() => confirmadas.reduce((a, c) => a + c.comissaoCalculada, 0), [confirmadas]);
  const totalVendas = useMemo(() => confirmadas.reduce((a, c) => a + c.valorTotal, 0), [confirmadas]);

  // Comissão por passeio
  const porPasseio = useMemo(() => {
    const map = new Map<string, { nome: string; comissao: number; count: number }>();
    confirmadas.forEach(s => {
      const cur = map.get(s.passeioId) || { nome: s.passeioNome, comissao: 0, count: 0 };
      map.set(s.passeioId, { nome: s.passeioNome, comissao: cur.comissao + s.comissaoCalculada, count: cur.count + 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.comissao - a.comissao);
  }, [confirmadas]);

  const PERIOD_OPTS = [
    { value: '7', label: '7 dias' },
    { value: '30', label: '30 dias' },
    { value: '90', label: '90 dias' },
    { value: 'all', label: 'Tudo' },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho + seletor */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Minhas comissões</h1>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5">
          {PERIOD_OPTS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === opt.value ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Comissão — destaque máximo */}
        <div className="sm:col-span-1 bg-green-600 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Minhas comissões</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalComissao)}</p>
          <p className="text-sm text-green-200 mt-1">{confirmadas.length} venda{confirmadas.length !== 1 ? 's' : ''} confirmada{confirmadas.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Volume total vendido</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(totalVendas)}</p>
          <p className="text-xs text-gray-400 mt-1">Valor dos passeios</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Média por venda</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(confirmadas.length > 0 ? totalComissao / confirmadas.length : 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">em comissão</p>
        </div>
      </div>

      {/* Comissão por passeio */}
      {porPasseio.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Comissão por passeio</h3>
          <div className="space-y-2">
            {porPasseio.map(item => {
              const pct = totalComissao > 0 ? (item.comissao / totalComissao) * 100 : 0;
              return (
                <div key={item.nome}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.nome}</span>
                      <span className="text-xs text-gray-400 ml-2">{item.count}x</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(item.comissao)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 bg-green-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico detalhado */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Histórico de vendas</h3>
        </div>
        {mySales.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhuma venda no período selecionado.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {mySales.map(sale => (
              <div key={sale.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${sale.status === 'cancelada' ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 dark:text-white truncate">{sale.clienteNome}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sale.status === 'confirmada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600'}`}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{sale.passeioNome}</span>
                    <span>·</span>
                    <span>{formatDate(safeToDate(sale.dataVenda))}</span>
                    {(sale.quantidadePessoas || 0) > 1 && <><span>·</span><span>{sale.quantidadePessoas} pessoas</span></>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-green-600 dark:text-green-400 text-sm">
                    {sale.status === 'confirmada' ? '+' : ''}{formatCurrency(sale.comissaoCalculada)}
                  </div>
                  <div className="text-xs text-gray-400">{formatCurrency(sale.valorTotal)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}