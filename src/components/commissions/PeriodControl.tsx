// src/components/commissions/PeriodControl.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { safeToDate } from '../../utils/commissionCalculations';

interface PeriodControlProps {
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  onArchiveComplete: () => void;
}

// Funções auxiliares para períodos quinzenais
export function getCurrentQuinzena(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();
  const quinzena = day <= 15 ? '1' : '2';
  return `${year}-${month}-${quinzena}`;
}

export function getQuinzenaLabel(period: string): string {
  const [year, month, quinzena] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const periodText = quinzena === '1' ? '1-15' : '16-30/31';
  return `${periodText} de ${monthName}`;
}

export function getQuinzenaDateRange(period: string): { start: Date; end: Date } {
  const [year, month, quinzena] = period.split('-').map(Number);
  const start = new Date(year, month - 1, quinzena === 1 ? 1 : 16);
  start.setHours(0, 0, 0, 0);
  
  let end: Date;
  if (quinzena === 1) {
    end = new Date(year, month - 1, 15);
  } else {
    end = new Date(year, month, 0); // Último dia do mês
  }
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// 🆕 Versão limpa da função solicitada
export function getAdjacentQuinzena(period: string, direction: 'prev' | 'next'): string {
  const [year, month, quinzena] = period.split('-').map(Number);
  
  if (direction === 'prev') {
    if (quinzena === 1) {
      // Voltar para segunda quinzena do mês anterior
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      return `${prevYear}-${String(prevMonth).padStart(2, '0')}-2`;
    } else {
      // Voltar para primeira quinzena do mesmo mês
      return `${year}-${String(month).padStart(2, '0')}-1`;
    }
  } else {
    if (quinzena === 1) {
      // Avançar para segunda quinzena do mesmo mês
      return `${year}-${String(month).padStart(2, '0')}-2`;
    } else {
      // Avançar para primeira quinzena do próximo mês
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      return `${nextYear}-${String(nextMonth).padStart(2, '0')}-1`;
    }
  }
}

export function PeriodControl({ currentPeriod, onPeriodChange, onArchiveComplete }: PeriodControlProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveStats, setArchiveStats] = useState({ total: 0, valor: 0 });
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadAvailablePeriods();
  }, []);

  const loadAvailablePeriods = async () => {
    try {
      const periods = new Set<string>();
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        // Se tem período definido, adicionar
        if (data.periodoComissao) {
          periods.add(data.periodoComissao);
        }
        
        // Também calcular período baseado na data da venda
        const saleDate = safeToDate(data.dataVenda);
        if (saleDate) {
          const year = saleDate.getFullYear();
          const month = String(saleDate.getMonth() + 1).padStart(2, '0');
          const day = saleDate.getDate();
          const quinzena = day <= 15 ? '1' : '2';
          periods.add(`${year}-${month}-${quinzena}`);
        }
      });
      
      const sorted = Array.from(periods).sort().reverse();
      setAvailablePeriods(sorted);
      
      // Se não houver período atual definido, usar o mais recente ou atual
      if (!currentPeriod) {
        onPeriodChange(sorted[0] || getCurrentQuinzena());
      }
    } catch (error) {
      console.error('Erro ao carregar períodos:', error);
    }
  };

  const checkArchiveStats = async () => {
    try {
      const { start, end } = getQuinzenaDateRange(currentPeriod);
      
      console.log('🔍 Verificando vendas para arquivar:', {
        periodo: currentPeriod,
        start: start.toISOString(),
        end: end.toISOString()
      });
      
      // 🔧 CORREÇÃO: Buscar TODAS as vendas e filtrar no cliente
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      
      let total = 0;
      let valor = 0;
      const vendasEncontradas: any[] = [];
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const saleDate = safeToDate(data.dataVenda);
        
        // Verificar se a venda é da quinzena atual
        const isInPeriod = saleDate >= start && saleDate <= end;
        const isConfirmada = data.status === 'confirmada';
        const isPaid = data.paymentStatus === 'paid';
        const isNotArchived = !data.arquivado;
        
        if (isInPeriod && isConfirmada && isPaid && isNotArchived) {
          total++;
          valor += data.comissaoCalculada || 0;
          vendasEncontradas.push({
            id: doc.id,
            cliente: data.clienteNome,
            data: saleDate.toISOString(),
            valor: data.comissaoCalculada
          });
        }
      });
      
      console.log(`✅ Encontradas ${total} vendas para arquivar:`, vendasEncontradas);
      
      setArchiveStats({ total, valor });
    } catch (error) {
      console.error('❌ Erro ao verificar vendas:', error);
      showToast('Erro ao verificar vendas para arquivar', 'error');
    }
  };

  const handleArchivePeriod = async () => {
    if (!isAdmin) {
      showToast('Apenas administradores podem arquivar períodos', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { start, end } = getQuinzenaDateRange(currentPeriod);
      
      // Buscar todas as vendas
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      const batch = writeBatch(db);
      const now = Timestamp.now();
      let archiveCount = 0;
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const saleDate = safeToDate(data.dataVenda);
        
        // Verificar se deve arquivar
        const isInPeriod = saleDate >= start && saleDate <= end;
        const isConfirmada = data.status === 'confirmada';
        const isPaid = data.paymentStatus === 'paid';
        const isNotArchived = !data.arquivado;
        
        if (isInPeriod && isConfirmada && isPaid && isNotArchived) {
          batch.update(doc.ref, {
            arquivado: true,
            dataArquivamento: now,
            periodoComissao: currentPeriod,
            arquivadoPor: user?.id,
            arquivadoPorNome: user?.name
          });
          archiveCount++;
        }
      });

      if (archiveCount > 0) {
        await batch.commit();
        showToast(`✅ ${archiveCount} vendas da quinzena arquivadas com sucesso!`, 'success');
        
        // Recarregar períodos disponíveis
        await loadAvailablePeriods();
      } else {
        showToast('ℹ️ Nenhuma venda paga para arquivar nesta quinzena', 'info');
      }
      
      setShowArchiveConfirm(false);
      onArchiveComplete();
    } catch (error) {
      console.error('❌ Erro ao arquivar:', error);
      showToast('Erro ao arquivar período: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenArchiveModal = async () => {
    await checkArchiveStats();
    setShowArchiveConfirm(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPeriodChange(getAdjacentQuinzena(currentPeriod, 'prev'))}
              className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700"
              title="Quinzena anterior"
            >
              ←
            </button>
            
            <div className="relative">
              <select
                value={currentPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium appearance-none cursor-pointer min-w-[200px] shadow-sm"
              >
                <option value={currentPeriod}>
                  {getQuinzenaLabel(currentPeriod)} (Atual)
                </option>
                {availablePeriods
                  .filter(p => p !== currentPeriod)
                  .map(period => (
                    <option key={period} value={period}>
                      {getQuinzenaLabel(period)}
                    </option>
                  ))
                }
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
            
            <button
              onClick={() => onPeriodChange(getAdjacentQuinzena(currentPeriod, 'next'))}
              className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700"
              title="Próxima quinzena"
            >
              →
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenArchiveModal}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
            >
              🔒 Fechar Quinzena
            </button>
          )}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Período: {getQuinzenaLabel(currentPeriod)}</span>
          {isAdmin && (
            <span className="ml-auto">💰 Admin: pode arquivar vendas pagas desta quinzena</span>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Arquivamento */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArchiveConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Fechar Quinzena
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você está prestes a arquivar todas as vendas pagas da quinzena:
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-2">
                {getQuinzenaLabel(currentPeriod)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vendas pagas:</span>
                <span className="font-bold text-gray-900 dark:text-white">{archiveStats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor total:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(archiveStats.valor)}
                </span>
              </div>
            </div>
            
            {archiveStats.total === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠️ Nenhuma venda paga encontrada nesta quinzena.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                  Verifique se as vendas deste período estão marcadas como "Pagas".
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Estas vendas serão movidas para o histórico e não aparecerão mais no dashboard atual.
              Você ainda poderá acessá-las selecionando o período correspondente.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchivePeriod}
                disabled={loading || archiveStats.total === 0}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Arquivando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}