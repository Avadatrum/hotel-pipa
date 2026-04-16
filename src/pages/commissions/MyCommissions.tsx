// src/pages/commissions/MyCommissions.tsx
import { useMemo, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, safeToDate } from '../../utils/commissionCalculations';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales, loading } = useCommissions();
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [numeroRecepcionistas, setNumeroRecepcionistas] = useState(4);

  useEffect(() => {
    getDoc(doc(db, 'appSettings', 'commissions')).then(snap => {
      if (snap.exists()) {
        setNumeroRecepcionistas(snap.data().numeroRecepcionistas || 4);
      }
    });
  }, []);

  // 🔧 Vendas que EU fiz no período
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

  // 🔧 TODAS as vendas do sistema (para cálculo da divisão)
  const allSales = useMemo(() => {
    const now = new Date();
    return (sales || [])
      .filter(s => {
        if (period === 'all') return true;
        const days = parseInt(period);
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return safeToDate(s.dataVenda) >= cutoff;
      });
  }, [sales, period]);

  const myConfirmadas = useMemo(() => mySales.filter(s => s.status === 'confirmada'), [mySales]);
  
  // 🔧 CORREÇÃO: Usar TODAS as vendas do sistema para calcular pendente/pago
  const allConfirmadas = useMemo(() => allSales.filter(s => s.status === 'confirmada'), [allSales]);
  const allPendentes = useMemo(() => 
    allConfirmadas.filter(s => !s.paymentStatus || s.paymentStatus === 'pending'), 
    [allConfirmadas]
  );
  const allPagas = useMemo(() => 
    allConfirmadas.filter(s => s.paymentStatus === 'paid'), 
    [allConfirmadas]
  );
  
  // Totais GERAL (todas as vendas do sistema)
  const totalComissaoGeral = useMemo(() => 
    allConfirmadas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allConfirmadas]
  );
  const totalPendenteGeral = useMemo(() => 
    allPendentes.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allPendentes]
  );
  const totalPagoGeral = useMemo(() => 
    allPagas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allPagas]
  );
  
  // Total que EU vendi (apenas para o card "Total Vendido")
  const totalVendidoPorMim = useMemo(() => 
    myConfirmadas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [myConfirmadas]
  );
  const volumeVendidoPorMim = useMemo(() => 
    myConfirmadas.reduce((a, c) => a + c.valorTotal, 0), 
    [myConfirmadas]
  );

  // 🔧 CORREÇÃO: Valores individuais baseados no TOTAL GERAL do sistema
  const comissaoIndividualGeral = totalComissaoGeral / numeroRecepcionistas;
  const pendenteIndividual = totalPendenteGeral / numeroRecepcionistas;
  const pagoIndividual = totalPagoGeral / numeroRecepcionistas;

  // Comissão por passeio (apenas o que EU vendi)
  const porPasseio = useMemo(() => {
    const map = new Map<string, { nome: string; comissao: number; count: number }>();
    myConfirmadas.forEach(s => {
      const cur = map.get(s.passeioId) || { nome: s.passeioNome, comissao: 0, count: 0 };
      map.set(s.passeioId, { nome: s.passeioNome, comissao: cur.comissao + s.comissaoCalculada, count: cur.count + 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.comissao - a.comissao);
  }, [myConfirmadas]);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total que EU vendi */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Total Vendido</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalVendidoPorMim)}</p>
          <p className="text-sm text-green-200 mt-1">{myConfirmadas.length} vendas</p>
          <p className="text-xs text-green-200 mt-0.5">Volume: {formatCurrency(volumeVendidoPorMim)}</p>
        </div>

        {/* Minha Parte (baseado no TOTAL GERAL) */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Minha Parte (1/{numeroRecepcionistas})</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(comissaoIndividualGeral)}</p>
          <p className="text-sm text-blue-200 mt-1">do total geral</p>
        </div>

        {/* Pendente (baseado no TOTAL GERAL) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Pendente (minha parte)</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-2">{formatCurrency(pendenteIndividual)}</p>
          <p className="text-xs text-gray-400 mt-1">{allPendentes.length} vendas pendentes no sistema</p>
        </div>

        {/* Já Recebido (baseado no TOTAL GERAL) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-green-200 dark:border-green-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Já Recebido</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(pagoIndividual)}</p>
          <p className="text-xs text-gray-400 mt-1">{allPagas.length} vendas pagas no sistema</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Resumo Detalhado</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total de comissões geradas (sistema)</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalComissaoGeral)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Divisão por {numeroRecepcionistas} recepcionistas</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(comissaoIndividualGeral)} cada</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Pendente para você</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendenteIndividual)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Já pago para você</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(pagoIndividual)}</p>
          </div>
        </div>
      </div>

      {porPasseio.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Comissão por passeio</h3>
          <div className="space-y-2">
            {porPasseio.map(item => {
              const pct = totalComissaoGeral > 0 ? (item.comissao / totalComissaoGeral) * 100 : 0;
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
                    {sale.status === 'confirmada' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sale.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {sale.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    )}
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
                  {sale.status === 'confirmada' && (
                    <div className="text-[10px] text-blue-500">
                      Sua parte: {formatCurrency(sale.comissaoCalculada / numeroRecepcionistas)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}