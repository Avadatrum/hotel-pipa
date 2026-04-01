// src/pages/LossesPage.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import type { LossEntry } from '../types';

export function LossesPage() {
  const { showToast } = useToast();
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'losses'), orderBy('ts', 'desc')),
      (snapshot) => {
        const items: LossEntry[] = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as LossEntry);
        });
        setLosses(items);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredLosses = filter
    ? losses.filter(l => String(l.apt).includes(filter) || (l.guest || '').toLowerCase().includes(filter.toLowerCase()))
    : losses;

  const totalLost = losses.reduce((sum, l) => sum + l.lost, 0);

  const exportCSV = () => {
    const headers = ['Data', 'Apto', 'Bloco', 'Hóspede', 'Perdas'];
    const rows = losses.map(l => [l.date, l.apt, l.block, l.guest || '-', l.lost]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `perdas_toalhas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('📥 Relatório exportado com sucesso!', 'success');
  };

  const deleteLoss = async (id: string) => {
    if (confirm('⚠️ Tem certeza que deseja excluir este registro de perda?')) {
      await deleteDoc(doc(db, 'losses', id));
      showToast('🗑️ Registro excluído com sucesso!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Registro de Perdas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total acumulado: <strong className="text-red-600 dark:text-red-400">{totalLost}</strong> toalhas perdidas</p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          📥 Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Filtrar por apto ou hóspede..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {filteredLosses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            ✅ Nenhuma perda registrada
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Apto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bloco</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hóspede</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Perdas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLosses.map(loss => (
                  <tr key={loss.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{loss.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">Apto {loss.apt}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{loss.block || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{loss.guest || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">
                        -{loss.lost} toalha(s)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteLoss(loss.id!)}
                        className="text-red-500 hover:text-red-700 text-sm transition-colors"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}