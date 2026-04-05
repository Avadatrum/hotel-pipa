// src/components/LossesPanel.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import type { LossEntry } from '../types';

interface LossesPanelProps {
  limit?: number;
  showExport?: boolean;
}

export function LossesPanel({ limit: propLimit, showExport = true }: LossesPanelProps) {
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLosses, setFilteredLosses] = useState<LossEntry[]>([]);
  const { showToast } = useToast();

  // Carrega as perdas
  useEffect(() => {
    let q = query(collection(db, 'losses'), orderBy('ts', 'desc'));
    
    if (propLimit && propLimit > 0) {
      q = query(collection(db, 'losses'), orderBy('ts', 'desc'), firestoreLimit(propLimit));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: LossEntry[] = [];
      snapshot.forEach(d => {
        items.push({ id: d.id, ...d.data() } as LossEntry);
      });
      setLosses(items);
    });
    
    return () => unsubscribe();
  }, [propLimit]);

  // Filtra as perdas baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLosses(losses);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = losses.filter(loss => 
        String(loss.apt).toLowerCase().includes(term) ||
        (loss.guest && loss.guest.toLowerCase().includes(term))
      );
      setFilteredLosses(filtered);
    }
  }, [searchTerm, losses]);

  // Excluir perda
  const handleDeleteLoss = async (id: string | undefined) => {
    // CORREÇÃO: Verifica se o ID existe antes de prosseguir
    if (!id) {
      console.error("ID do documento não encontrado");
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este registro de perda?')) {
      try {
        await deleteDoc(doc(db, 'losses', id));
        showToast('✅ Perda excluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir perda:', error);
        showToast('❌ Erro ao excluir perda', 'error');
      }
    }
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Apartamento', 'Hóspede', 'Toalhas Perdidas'];
    const csvData = filteredLosses.map(loss => [
      loss.date,
      loss.apt,
      loss.guest || '',
      loss.lost.toString()
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `perdas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('📊 Relatório exportado com sucesso!', 'success');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="font-semibold text-gray-800 dark:text-white">⚠️ Registro de Perdas</h2>
        {showExport && filteredLosses.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
          >
            📥 Exportar CSV
          </button>
        )}
      </div>

      {/* Campo de busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar por apartamento ou hóspede..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Lista de perdas */}
      {filteredLosses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {losses.length === 0 ? '✅ Nenhuma perda registrada' : '🔍 Nenhuma perda encontrada para esta busca'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLosses.map(loss => (
            <div key={loss.id || 'temp-key'} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Apto {loss.apt}</span>
                  {loss.guest && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">- {loss.guest}</span>
                  )}
                  <span className="text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
                    -{loss.lost} toalha(s)
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  📅 {loss.date}
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteLoss(loss.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
                title="Excluir perda"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      {filteredLosses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total de perdas: <span className="font-bold text-red-600 dark:text-red-400">
              {filteredLosses.reduce((sum, loss) => sum + loss.lost, 0)} toalhas
            </span>
            {searchTerm && (
              <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                (filtrado de {losses.length} registros)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}