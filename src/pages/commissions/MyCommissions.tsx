import { useMemo, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, safeToDate } from '../../utils/commissionCalculations';
import { getCurrentQuinzena, getQuinzenaLabel, getQuinzenaDateRange, getAdjacentQuinzena } from '../../components/commissions/PeriodControl';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales, loading } = useCommissions();
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentQuinzena());
  const [numeroRecepcionistas, setNumeroRecepcionistas] = useState(4);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  useEffect(() => {
    getDoc(doc(db, 'appSettings', 'commissions')).then(snap => {
      if (snap.exists()) {
        setNumeroRecepcionistas(snap.data().numeroRecepcionistas || 4);
      }
    });
    
    // Carregar períodos disponíveis
    const periods = new Set<string>();
    sales.forEach(sale => {
      if (sale.periodoComissao) {
        periods.add(sale.periodoComissao);
      }
    });
    const sorted = Array.from(periods).sort().reverse();
    setAvailablePeriods(sorted);
    
    // Se não houver período selecionado, usar o mais recente
    if (sorted.length > 0 && !selectedPeriod) {
      setSelectedPeriod(sorted[0]);
    }
  }, [sales]);

  // Filtrar vendas pelo período quinzenal selecionado
  const salesInPeriod = useMemo(() => {
    const { start, end } = getQuinzenaDateRange(selectedPeriod);
    
    return sales.filter(sale => {
      const saleDate = safeToDate(sale.dataVenda);
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, selectedPeriod]);

  // Minhas vendas no período
  const mySales = useMemo(() => {
    return salesInPeriod
      .filter(s => s.vendedorId === user?.id)
      .sort((a, b) => safeToDate(b.dataVenda).getTime() - safeToDate(a.dataVenda).getTime());
  }, [salesInPeriod, user]);

  const myConfirmadas = useMemo(() => mySales.filter(s => s.status === 'confirmada'), [mySales]);
  
  // Todas as vendas do período
  const allConfirmadas = useMemo(() => 
    salesInPeriod.filter(s => s.status === 'confirmada'), 
    [salesInPeriod]
  );
  
  const allPendentes = useMemo(() => 
    allConfirmadas.filter(s => !s.paymentStatus || s.paymentStatus === 'pending'), 
    [allConfirmadas]
  );
  
  const allPagas = useMemo(() => 
    allConfirmadas.filter(s => s.paymentStatus === 'paid'), 
    [allConfirmadas]
  );
  
  // Totais do período
  const totalComissaoPeriodo = useMemo(() => 
    allConfirmadas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allConfirmadas]
  );
  
  const totalPendentePeriodo = useMemo(() => 
    allPendentes.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allPendentes]
  );
  
  const totalPagoPeriodo = useMemo(() => 
    allPagas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [allPagas]
  );
  
  // Total que EU vendi no período
  const totalVendidoPorMim = useMemo(() => 
    myConfirmadas.reduce((a, c) => a + c.comissaoCalculada, 0), 
    [myConfirmadas]
  );
  
  const volumeVendidoPorMim = useMemo(() => 
    myConfirmadas.reduce((a, c) => a + c.valorTotal, 0), 
    [myConfirmadas]
  );

  // Valores individuais baseados no total do período
  const comissaoIndividual = totalComissaoPeriodo / numeroRecepcionistas;
  const pendenteIndividual = totalPendentePeriodo / numeroRecepcionistas;
  const pagoIndividual = totalPagoPeriodo / numeroRecepcionistas;

  // Comissão por passeio (apenas o que EU vendi no período)
  const porPasseio = useMemo(() => {
    const map = new Map<string, { nome: string; comissao: number; count: number }>();
    myConfirmadas.forEach(s => {
      const cur = map.get(s.passeioId) || { nome: s.passeioNome, comissao: 0, count: 0 };
      map.set(s.passeioId, { 
        nome: s.passeioNome, 
        comissao: cur.comissao + s.comissaoCalculada, 
        count: cur.count + 1 
      });
    });
    return Array.from(map.values()).sort((a, b) => b.comissao - a.comissao);
  }, [myConfirmadas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com seletor de quinzena */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Minhas comissões</h1>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPeriod(getAdjacentQuinzena(selectedPeriod, 'prev'))}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            ←
          </button>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-w-[200px]"
          >
            <option value={selectedPeriod}>{getQuinzenaLabel(selectedPeriod)}</option>
            {availablePeriods
              .filter(p => p !== selectedPeriod)
              .map(period => (
                <option key={period} value={period}>
                  {getQuinzenaLabel(period)}
                </option>
              ))
            }
          </select>
          
          <button
            onClick={() => setSelectedPeriod(getAdjacentQuinzena(selectedPeriod, 'next'))}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>

      {/* Cards de resumo da quinzena */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total que EU vendi na quinzena */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">
            Minhas Vendas na Quinzena
          </p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalVendidoPorMim)}</p>
          <p className="text-sm text-green-200 mt-1">{myConfirmadas.length} vendas</p>
          <p className="text-xs text-green-200 mt-0.5">
            Volume: {formatCurrency(volumeVendidoPorMim)}
          </p>
        </div>

        {/* Minha Parte na quinzena */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
            Minha Parte (1/{numeroRecepcionistas})
          </p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(comissaoIndividual)}</p>
          <p className="text-sm text-blue-200 mt-1">desta quinzena</p>
          <p className="text-xs text-blue-200 mt-0.5">
            Total geral: {formatCurrency(totalComissaoPeriodo)}
          </p>
        </div>

        {/* Pendente na quinzena */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            A Receber
          </p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-2">
            {formatCurrency(pendenteIndividual)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {allPendentes.length} vendas pendentes
          </p>
        </div>

        {/* Já Recebido na quinzena */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-green-200 dark:border-green-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
            Já Recebido
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {formatCurrency(pagoIndividual)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {allPagas.length} vendas pagas
          </p>
        </div>
      </div>

      {/* Resumo detalhado da quinzena */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
          📊 Resumo da Quinzena: {getQuinzenaLabel(selectedPeriod)}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total de comissões</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalComissaoPeriodo)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Sua parte</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(comissaoIndividual)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Pendente</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(pendenteIndividual)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Pago</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(pagoIndividual)}
            </p>
          </div>
        </div>
      </div>

      {/* Comissão por passeio */}
      {porPasseio.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">
            🎯 Comissão por passeio (suas vendas)
          </h3>
          <div className="space-y-3">
            {porPasseio.map(item => {
              const pct = totalComissaoPeriodo > 0 ? (item.comissao / totalComissaoPeriodo) * 100 : 0;
              return (
                <div key={item.nome}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.nome}</span>
                      <span className="text-xs text-gray-400 ml-2">{item.count}x</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(item.comissao)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-1.5 bg-green-500 rounded-full transition-all duration-700" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico de vendas da quinzena */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            📝 Minhas vendas na quinzena
          </h3>
        </div>
        {mySales.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Nenhuma venda sua nesta quinzena.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {mySales.map(sale => (
              <div key={sale.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${sale.status === 'cancelada' ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 dark:text-white truncate">
                      {sale.clienteNome}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      sale.status === 'confirmada' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {sale.status}
                    </span>
                    {sale.status === 'confirmada' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        sale.paymentStatus === 'paid' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {sale.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{sale.passeioNome}</span>
                    <span>·</span>
                    <span>{formatDate(safeToDate(sale.dataVenda))}</span>
                    {(sale.quantidadePessoas || 0) > 1 && (
                      <><span>·</span><span>{sale.quantidadePessoas} pessoas</span></>
                    )}
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