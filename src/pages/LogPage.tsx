// src/pages/LogPage.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import type { LogEntry } from '../types';

interface LogPageProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function LogPage({ showToast }: LogPageProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterApt, setFilterApt] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'log'), orderBy('ts', 'desc'), limit(500)),
      (snapshot) => {
        const items: LogEntry[] = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as LogEntry);
        });
        setLogs(items);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterApt && !String(log.apt).includes(filterApt)) return false;
    if (filterType && log.type !== filterType) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Data', 'Hora', 'Apto', 'Mensagem', 'Tipo'];
    const rows = logs.map(l => [l.date, l.time, l.apt, `"${l.msg}"`, l.type]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('📥 Histórico exportado com sucesso!', 'success');
  };

  const clearAllLogs = async () => {
    if (confirm('⚠️ ATENÇÃO! Isso vai apagar TODO o histórico. Essa ação não pode ser desfeita. Tem certeza?')) {
      const batch = writeBatch(db);
      logs.forEach(log => {
        if (log.id) {
          batch.delete(doc(db, 'log', log.id));
        }
      });
      await batch.commit();
      showToast('🗑️ Histórico limpo com sucesso!', 'success');
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      checkin: 'bg-green-100 text-green-700',
      checkout: 'bg-red-100 text-red-700',
      towel: 'bg-blue-100 text-blue-700',
      other: 'bg-gray-100 text-gray-600'
    };
    const labels: Record<string, string> = {
      checkin: '↓ Check-in',
      checkout: '↑ Check-out',
      towel: '🧺 Toalha',
      other: '📝 Outro'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[type] || styles.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Movimentações</h1>
          <p className="text-gray-500 text-sm mt-1">Total de registros: {logs.length}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={clearAllLogs}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            🗑️ Limpar Histórico
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Filtrar por apartamento..."
            value={filterApt}
            onChange={(e) => setFilterApt(e.target.value)}
            className="border rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="checkin">Check-in</option>
            <option value="checkout">Check-out</option>
            <option value="towel">Toalhas/Fichas</option>
            <option value="other">Outros</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            📭 Nenhum registro encontrado
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                <div className="min-w-[100px]">
                  <div className="text-sm font-medium text-gray-700">{log.date}</div>
                  <div className="text-xs text-gray-400">{log.time}</div>
                </div>
                <div className="min-w-[70px]">
                  <span className="font-bold text-blue-600">Apto {log.apt}</span>
                </div>
                <div className="flex-1 text-sm text-gray-700">{log.msg}</div>
                <div>{getTypeBadge(log.type)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}