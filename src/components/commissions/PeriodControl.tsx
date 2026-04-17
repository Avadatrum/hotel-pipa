// src/components/commissions/PeriodControl.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';

interface PeriodControlProps {
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  onArchiveComplete: () => void;
}

export function PeriodControl({ currentPeriod, onPeriodChange, onArchiveComplete }: PeriodControlProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    loadAvailablePeriods();
  }, []);

  const loadAvailablePeriods = async () => {
    const periods = new Set<string>();
    const salesSnapshot = await getDocs(collection(db, 'sales'));
    salesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.periodoComissao) {
        periods.add(data.periodoComissao);
      }
    });
    setAvailablePeriods(Array.from(periods).sort().reverse());
  };

  const getPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleArchivePeriod = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // 🔧 CORREÇÃO: Query sem where (evita erro de índice)
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      
      const now = Timestamp.now();
      let archiveCount = 0;
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        // Filtrar manualmente no cliente
        if (data.paymentStatus === 'paid' && !data.arquivado) {
          batch.update(doc.ref, {
            arquivado: true,
            dataArquivamento: now,
            periodoComissao: currentPeriod
          });
          archiveCount++;
        }
      });

      if (archiveCount > 0) {
        await batch.commit();
        showToast(`${archiveCount} vendas arquivadas com sucesso!`, 'success');
      } else {
        showToast('Nenhuma venda paga para arquivar', 'info');
      }
      
      setShowArchiveConfirm(false);
      onArchiveComplete();
      loadAvailablePeriods();
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      showToast('Erro ao arquivar período', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextPeriod = () => {
    const [year, month] = currentPeriod.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    const newPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onPeriodChange(newPeriod);
  };

  const prevPeriod = () => {
    const [year, month] = currentPeriod.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    const newPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onPeriodChange(newPeriod);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={prevPeriod}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              ←
            </button>
            
            <select
              value={currentPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium"
            >
              <option value={currentPeriod}>{getPeriodLabel(currentPeriod)} (Atual)</option>
              {availablePeriods.filter(p => p !== currentPeriod).map(period => (
                <option key={period} value={period}>{getPeriodLabel(period)}</option>
              ))}
            </select>
            
            <button
              onClick={nextPeriod}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              →
            </button>
          </div>

          <button
            onClick={() => setShowArchiveConfirm(true)}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            📦 Arquivar Pagos do Período
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArchiveConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              📦 Arquivar Período
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Todas as vendas pagas serão arquivadas e sairão do dashboard atual.
              Você ainda poderá acessá-las pelo filtro de período.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchivePeriod}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
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