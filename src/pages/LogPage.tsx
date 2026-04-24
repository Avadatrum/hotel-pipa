// src/pages/LogPage.tsx - ATUALIZADO (DEBUG REMOVIDO E LIMPEZA DE ASSINATURAS ATUALIZADA)
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { clearAllSignatures } from '../services/towelService'; // 🆕 import
import { useToast } from '../hooks/useToast';
import type { LogEntry, TowelSignature } from '../types';

// Buscar todas as assinaturas de todos os apartamentos
async function getAllSignatures(): Promise<(TowelSignature & { aptNumber: number })[]> {
  const allApts = [1,2,3,4,5,6,7,8,10,11,12,21,22,23,24,25,26,27,28,29,31,32,33,34,35,41,42,43,44,45,46,47];
  const allSignatures: (TowelSignature & { aptNumber: number })[] = [];
  
  console.log('🔍 Buscando assinaturas em todos os apartamentos...');
  
  for (const apt of allApts) {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const colRef = collection(db, 'apartments', String(apt), 'towelSignatures');
      
      // Removido orderBy para evitar erro de índice
      const q = query(colRef, where('used', '==', true));
      const snapshot = await getDocs(q);
      
      console.log(`📦 Apto ${apt}: ${snapshot.docs.length} assinatura(s)`);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as TowelSignature;
        allSignatures.push({
          ...data,
          id: doc.id,
          aptNumber: apt
        });
      });
    } catch (error: any) {
      console.error(`❌ Erro ao buscar assinaturas do apto ${apt}:`, error.message);
    }
  }
  
  // Ordena manualmente (mais recente primeiro)
  allSignatures.sort((a, b) => {
    const dateA = a.signedAt ? new Date(a.signedAt).getTime() : 0;
    const dateB = b.signedAt ? new Date(b.signedAt).getTime() : 0;
    return dateB - dateA;
  });
  
  console.log(`✅ Total de assinaturas encontradas: ${allSignatures.length}`);
  return allSignatures;
}

export function LogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [signatures, setSignatures] = useState<(TowelSignature & { aptNumber: number })[]>([]);
  const [filterApt, setFilterApt] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'signatures'>('logs');
  const [loadingSignatures, setLoadingSignatures] = useState(false);

  // Carregar logs
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

  // Carregar assinaturas quando mudar para a aba
  useEffect(() => {
    if (activeTab === 'signatures') {
      loadSignatures();
    }
  }, [activeTab]);

  const loadSignatures = async () => {
    setLoadingSignatures(true);
    try {
      const sigs = await getAllSignatures();
      setSignatures(sigs);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoadingSignatures(false);
    }
  };

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    if (filterApt && !String(log.apt).includes(filterApt)) return false;
    if (filterType && log.type !== filterType) return false;
    return true;
  });

  // Filtrar assinaturas
  const filteredSignatures = signatures.filter(sig => {
    if (filterApt && !String(sig.aptNumber).includes(filterApt)) return false;
    return true;
  });

  const exportCSV = () => {
    if (activeTab === 'logs') {
      const headers = ['Data', 'Hora', 'Apto', 'Mensagem', 'Tipo'];
      const rows = filteredLogs.map(l => [l.date, l.time, l.apt, `"${l.msg}"`, l.type]);
      const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `historico_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('📥 Histórico exportado com sucesso!', 'success');
    } else {
      const headers = ['Data', 'Apto', 'Hóspede', 'Operação', 'Quantidade', 'Status'];
      const rows = filteredSignatures.map(s => [
        s.signedAt ? new Date(s.signedAt).toLocaleDateString('pt-BR') : '',
        s.aptNumber,
        s.guestName,
        s.operation === 'chips_to_towels' ? 'Retirada' : 'Troca',
        s.quantity,
        s.wasCleared ? 'Limpa' : 'Ativa'
      ]);
      const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assinaturas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('📥 Assinaturas exportadas com sucesso!', 'success');
    }
  };

  const clearAllLogs = async () => {
    if (activeTab === 'logs') {
      if (confirm('⚠️ ATENÇÃO! Isso vai apagar TODO o histórico de movimentações. Essa ação não pode ser desfeita. Tem certeza?')) {
        try {
          const batch = writeBatch(db);
          logs.forEach(log => {
            if (log.id) {
              batch.delete(doc(db, 'log', log.id));
            }
          });
          await batch.commit();
          showToast('🗑️ Histórico limpo com sucesso!', 'success');
        } catch (error: any) {
          showToast('Erro ao limpar histórico: ' + error.message, 'error');
        }
      }
    } else {
      // 🆕 Limpar assinaturas
      if (confirm(
        '⚠️ LIMPAR TODAS AS ASSINATURAS?\n\n' +
        'Isso vai remover as imagens das assinaturas de TODOS os apartamentos.\n' +
        'Os metadados (data, nome, quantidade) serão mantidos para auditoria.\n' +
        'Apenas as imagens (parte pesada) serão apagadas.\n\n' +
        'Esta ação não pode ser desfeita. Continuar?'
      )) {
        try {
          const result = await clearAllSignatures();
          if (result.success) {
            showToast(`🗑️ ${result.count} assinatura(s) limpas com sucesso!`, 'success');
            loadSignatures(); // Recarrega a lista
          } else {
            showToast('Erro ao limpar assinaturas: ' + result.error, 'error');
          }
        } catch (error: any) {
          showToast('Erro ao limpar assinaturas: ' + error.message, 'error');
        }
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      checkin: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
      checkout: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
      towel: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
      other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sem data';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {activeTab === 'logs' ? '📋 Histórico de Movimentações' : '✍️ Registro de Assinaturas'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {activeTab === 'logs' 
              ? `Total de registros: ${logs.length}`
              : `Total de assinaturas: ${signatures.length}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            📥 Exportar {activeTab === 'logs' ? 'CSV' : 'Assinaturas'}
          </button>
          <button
            onClick={clearAllLogs}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            🗑️ {activeTab === 'logs' ? 'Limpar Histórico' : 'Limpar Assinaturas'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          📋 Movimentações ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('signatures')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'signatures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          ✍️ Assinaturas ({signatures.length})
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Filtrar por apartamento..."
            value={filterApt}
            onChange={(e) => setFilterApt(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {activeTab === 'logs' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos os tipos</option>
              <option value="checkin">Check-in</option>
              <option value="checkout">Check-out</option>
              <option value="towel">Toalhas/Fichas</option>
              <option value="other">Outros</option>
            </select>
          )}
          {/* Botão de refresh para assinaturas */}
          {activeTab === 'signatures' && (
            <button
              onClick={loadSignatures}
              disabled={loadingSignatures}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              🔄 {loadingSignatures ? 'Atualizando...' : 'Atualizar'}
            </button>
          )}
        </div>

        {/* Conteúdo */}
        {activeTab === 'logs' ? (
          // Lista de Logs
          filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              📭 Nenhum registro encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-3">
                  <div className="min-w-[100px]">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.date}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{log.time}</div>
                  </div>
                  <div className="min-w-[70px]">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Apto {log.apt}</span>
                  </div>
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">{log.msg}</div>
                  <div>{getTypeBadge(log.type)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Lista de Assinaturas
          loadingSignatures ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              Carregando assinaturas...
            </div>
          ) : filteredSignatures.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              ✍️ Nenhuma assinatura encontrada
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredSignatures.map((sig) => (
                <div key={sig.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        Apto {sig.aptNumber}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {sig.guestName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        sig.operation === 'chips_to_towels'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                      }`}>
                        {sig.operation === 'chips_to_towels' ? '🎫➜🧺 Retirada' : '🔄 Troca'}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded">
                        {sig.quantity} toalha(s)
                      </span>
                      {sig.wasCleared && (
                        <span className="text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                          🗑️ Limpa
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>📅 {formatDate(sig.signedAt)}</span>
                    {sig.expiresAt && (
                      <span>⏰ Expira: {formatDate(sig.expiresAt)}</span>
                    )}
                  </div>
                  
                  {/* Preview da assinatura */}
                  {sig.signature && !sig.wasCleared && (
                    <div className="mt-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-2">
                      <img
                        src={sig.signature}
                        alt={`Assinatura de ${sig.guestName}`}
                        className="max-h-16 mx-auto"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}