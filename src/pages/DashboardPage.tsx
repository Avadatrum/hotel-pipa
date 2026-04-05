// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useApartments } from '../hooks/useApartments';
import { useToast } from '../hooks/useToast';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import type { LossEntry, LogEntry } from '../types';
import { LossesPanel } from '../components/LossesPanel';
import { TabuaMareWidget } from '../components/TabuaMare/TabuaMareWidget';

export function DashboardPage() {
  const { apartments } = useApartments();
  const { showToast } = useToast();
  const [totalInventory, setTotalInventory] = useState(0);
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
  const [inventoryInput, setInventoryInput] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'inventory'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTotalInventory(data.total || 0);
        setInventoryInput(String(data.total || ''));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'losses'), orderBy('ts', 'desc'), limit(50)),
      (snapshot) => {
        const items: LossEntry[] = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as LossEntry));
        setLosses(items);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    const unsubscribe = onSnapshot(
      query(collection(db, 'log'), orderBy('ts', 'desc'), limit(100)),
      (snapshot) => {
        const items: LogEntry[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as LogEntry;
          if (data.date === today) items.push({ id: doc.id, ...data });
        });
        setTodayLogs(items);
      }
    );
    return () => unsubscribe();
  }, []);

  const stats = {
    totalApts: Object.keys(apartments).length,
    occupied: Object.values(apartments).filter(a => a.occupied).length,
    towelsOut: Object.values(apartments).reduce((sum, a) => sum + a.towels, 0),
    chipsOut: Object.values(apartments).reduce((sum, a) => sum + a.chips, 0),
    totalLosses: losses.reduce((sum, l) => sum + l.lost, 0),
    stock: totalInventory > 0
      ? totalInventory - Object.values(apartments).reduce((sum, a) => sum + a.towels, 0)
      : null,
  };

  const occupancyRate = stats.totalApts > 0
    ? Math.round((stats.occupied / stats.totalApts) * 100)
    : 0;

  const saveInventory = async () => {
    const value = parseInt(inventoryInput) || 0;
    await setDoc(doc(db, 'config', 'inventory'), { total: value });
    showToast(`✅ Inventário atualizado: ${value} toalhas`, 'success');
  };

  const todayStats = {
    checkins: todayLogs.filter(l => l.type === 'checkin').length,
    checkouts: todayLogs.filter(l => l.type === 'checkout').length,
    towelMovements: todayLogs.filter(l => l.type === 'towel').length,
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Painel de Controle</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral do hotel em tempo real</p>
      </div>

      {/* ── Linha 1: 4 cards de stats + card de maré ─────────────────────────
          Mobile:  1 coluna
          Tablet:  2 colunas
          Desktop: os 4 cards de stats ficam na primeira linha,
                   o card de maré ocupa largura total na segunda  
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Ocupação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ocupação</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.occupied}/{stats.totalApts}</p>
            </div>
            <div className="text-3xl">🏨</div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{occupancyRate}% ocupado</p>
          </div>
        </div>

        {/* Toalhas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toalhas com hóspedes</p>
              <p className="text-2xl font-bold text-green-600">{stats.towelsOut}</p>
            </div>
            <div className="text-3xl">🧺</div>
          </div>
          {stats.stock !== null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Estoque: {stats.stock} toalhas</p>
          )}
        </div>

        {/* Fichas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fichas em circulação</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.chipsOut}</p>
            </div>
            <div className="text-3xl">🎫</div>
          </div>
        </div>

        {/* Perdas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de perdas</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalLosses}</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>

        {/* ── Tábua de Marés — ocupa linha inteira em desktop ── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-cyan-500
                        col-span-1 sm:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🌊 Previsão da Maré</h3>
          </div>
          <TabuaMareWidget />
        </div>

      </div>

      {/* Controle de Estoque */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-3">📦 Controle de Estoque</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            value={inventoryInput}
            onChange={e => setInventoryInput(e.target.value)}
            placeholder="Total de toalhas do hotel"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button onClick={saveInventory} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Salvar
          </button>
          {stats.stock !== null && stats.stock < 10 && stats.stock >= 0 && (
            <span className="text-sm text-orange-600 dark:text-orange-400">
              ⚠️ Estoque baixo! Apenas {stats.stock} toalhas restantes.
            </span>
          )}
        </div>
      </div>

      {/* Resumo de hoje + Perdas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">📅 Resumo de Hoje</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayStats.checkins}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Check-ins</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{todayStats.checkouts}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Check-outs</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayStats.towelMovements}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Mov. toalhas</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <LossesPanel limit={5} showExport={false} />
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-3">📋 Atividade Recente</h2>
        {todayLogs.slice(0, 10).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhuma atividade hoje</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-16">{log.time}</span>
                <span className="font-medium w-16 text-gray-800 dark:text-gray-200">Apto {log.apt}</span>
                <span className="flex-1 text-gray-600 dark:text-gray-300">{log.msg}</span>
                <span className={`text-xs px-2 py-0.5 rounded
                  ${log.type === 'checkin'  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'  : ''}
                  ${log.type === 'checkout' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'    : ''}
                  ${log.type === 'towel'    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : ''}
                `}>
                  {log.type === 'checkin' ? 'Check-in' : log.type === 'checkout' ? 'Check-out' : 'Toalha'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}