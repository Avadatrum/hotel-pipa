// src/components/ApartmentHistoryModal.tsx - VERSÃO FINAL
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getSignatureHistory } from '../services/towelService';
import type { LogEntry, TowelSignature } from '../types';

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
  const [signatures, setSignatures] = useState<TowelSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'logs' | 'signatures'>('logs');

  // Carregar logs
  useEffect(() => {
    if (!isOpen || activeTab !== 'logs') return;

    setLoading(true);
    
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
  }, [isOpen, aptNumber, activeTab]);

  // Carregar assinaturas
  useEffect(() => {
    if (!isOpen || activeTab !== 'signatures') return;

    const loadSignatures = async () => {
      setLoading(true);
      try {
        const sigs = await getSignatureHistory(aptNumber);
        setSignatures(sigs);
      } catch (error) {
        console.error('Erro ao carregar assinaturas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSignatures();
  }, [isOpen, aptNumber, activeTab]);

  // Filtrar por tipo (apenas na aba de logs)
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data não disponível';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('logs'); setFilterType(''); }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            📋 Registros ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'signatures'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            ✍️ Assinaturas ({signatures.length})
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'logs' ? (
          <>
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
            <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-4">
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
          </>
        ) : (
          // Aba de Assinaturas
          <div className="overflow-y-auto max-h-[calc(90vh-230px)] p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-gray-500 dark:text-gray-400">Carregando assinaturas...</p>
                </div>
              </div>
            ) : signatures.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">✍️</div>
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma assinatura registrada para este apartamento.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  As assinaturas aparecerão aqui quando os hóspedes assinarem digitalmente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {signatures
                  .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
                  .map((sig) => (
                    <div
                      key={sig.id}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-800 px-2 py-1 rounded">
                            {sig.operation === 'chips_to_towels' ? '🎫 Fichas → Toalhas' : '🔄 Troca de Toalha'}
                          </span>
                        </div>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {formatDate(sig.signedAt)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          {sig.guestName}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          {sig.quantity} toalha(s)
                        </p>
                      </div>
                      
                      {/* Preview da assinatura */}
                      {sig.signature && !sig.wasCleared ? (
                        <div className="bg-white rounded-lg border border-amber-300 p-3">
                          <p className="text-xs text-gray-500 mb-2">Assinatura registrada:</p>
                          <img
                            src={sig.signature}
                            alt="Assinatura do hóspede"
                            className="max-h-24 mx-auto border border-gray-200 rounded"
                          />
                        </div>
                      ) : sig.wasCleared ? (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-400 italic">
                            🗑️ Assinatura removida no checkout ({formatDate(sig.clearedAt || '')})
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-400 italic">
                            📝 Assinatura não disponível
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
                        <span>Token: {sig.token?.substring(0, 8)}...</span>
                        <span>Expirou: {formatDate(sig.expiresAt)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeTab === 'logs' 
              ? `Total de registros: ${filteredHistory.length}`
              : `Total de assinaturas: ${signatures.length}`
            }
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