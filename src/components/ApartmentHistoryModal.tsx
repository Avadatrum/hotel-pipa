// src/components/ApartmentHistoryModal.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { LogEntry } from '../types';

interface ApartmentHistoryModalProps {
  isOpen: boolean;
  aptNumber: number;
  guestName?: string;
  blockName?: string;
  onClose: () => void;
}

export function ApartmentHistoryModal({ 
  isOpen, 
  aptNumber, 
  guestName, 
  blockName,
  onClose 
}: ApartmentHistoryModalProps) {
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    
    // Buscar histórico do apartamento específico
    const q = query(
      collection(db, 'log'),
      where('apt', '==', aptNumber),
      orderBy('ts', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: LogEntry[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as LogEntry);
      });
      setHistory(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, aptNumber]);

  // Filtrar por tipo
  const filteredHistory = filterType
    ? history.filter(item => item.type === filterType)
    : history;

  // Contagem por tipo
  const counts = {
    checkin: history.filter(h => h.type === 'checkin').length,
    checkout: history.filter(h => h.type === 'checkout').length,
    towel: history.filter(h => h.type === 'towel').length,
    other: history.filter(h => h.type === 'other').length,
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      checkin: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      checkout: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      towel: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    };
    const labels: Record<string, string> = {
      checkin: '↓ Check-in',
      checkout: '↑ Check-out',
      towel: '🧺 Toalha/Ficha',
      other: '📝 Outro'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[type] || styles.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Histórico - Apartamento {aptNumber}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {blockName && <span>📍 {blockName}</span>}
              {guestName && <span className="ml-2">👤 {guestName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos ({history.length})
            </button>
            <button
              onClick={() => setFilterType('checkin')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === 'checkin'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Check-ins ({counts.checkin})
            </button>
            <button
              onClick={() => setFilterType('checkout')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === 'checkout'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Check-outs ({counts.checkout})
            </button>
            <button
              onClick={() => setFilterType('towel')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === 'towel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toalhas/Fichas ({counts.towel})
            </button>
          </div>
        </div>

        {/* Lista de histórico */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-gray-500 dark:text-gray-400">Carregando histórico...</p>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 dark:text-gray-400">
                {filterType 
                  ? `Nenhum registro do tipo selecionado para este apartamento.`
                  : `Nenhum histórico encontrado para o apartamento ${aptNumber}.`}
              </p>
              {filterType && (
                <button
                  onClick={() => setFilterType('')}
                  className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Mostrar todos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {item.date} • {item.time}
                      </span>
                      {getTypeBadge(item.type)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.msg}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total de registros: {filteredHistory.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}