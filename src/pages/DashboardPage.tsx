// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useApartments } from '../hooks/useApartments';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import type { LossEntry, LogEntry } from '../types';

interface DashboardPageProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function DashboardPage({ showToast }: DashboardPageProps) {
  const { apartments } = useApartments();
  const [totalInventory, setTotalInventory] = useState(0);
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
  const [inventoryInput, setInventoryInput] = useState('');

  // Carrega o inventário
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'config', 'inventory'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTotalInventory(data.total || 0);
          setInventoryInput(String(data.total || ''));
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Carrega as perdas
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'losses'), orderBy('ts', 'desc'), limit(50)),
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

  // Carrega logs de hoje
  useEffect(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    const unsubscribe = onSnapshot(
      query(collection(db, 'log'), orderBy('ts', 'desc'), limit(100)),
      (snapshot) => {
        const items: LogEntry[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as LogEntry;
          if (data.date === today) {
            items.push({ id: doc.id, ...data });
          }
        });
        setTodayLogs(items);
      }
    );
    return () => unsubscribe();
  }, []);

  // Calcula estatísticas
  const stats = {
    totalApts: Object.keys(apartments).length,
    occupied: Object.values(apartments).filter(a => a.occupied).length,
    towelsOut: Object.values(apartments).reduce((sum, a) => sum + a.towels, 0),
    chipsOut: Object.values(apartments).reduce((sum, a) => sum + a.chips, 0),
    totalLosses: losses.reduce((sum, l) => sum + l.lost, 0),
    stock: totalInventory > 0 ? totalInventory - Object.values(apartments).reduce((sum, a) => sum + a.towels, 0) : null,
  };

  const occupancyRate = stats.totalApts > 0 ? Math.round((stats.occupied / stats.totalApts) * 100) : 0;

  // Salvar inventário
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Painel de Controle</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do hotel em tempo real</p>
      </div>

      {/* Cards de estatísticas - empilham no mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ocupação</p>
              <p className="text-2xl font-bold text-gray-800">{stats.occupied}/{stats.totalApts}</p>
            </div>
            <div className="text-3xl">🏨</div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{occupancyRate}% ocupado</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toalhas com hóspedes</p>
              <p className="text-2xl font-bold text-green-600">{stats.towelsOut}</p>
            </div>
            <div className="text-3xl">🧺</div>
          </div>
          {stats.stock !== null && (
            <p className="text-xs text-gray-500 mt-2">Estoque: {stats.stock} toalhas</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fichas em circulação</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.chipsOut}</p>
            </div>
            <div className="text-3xl">🎫</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de perdas</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalLosses}</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-800 mb-3">📦 Controle de Estoque</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            value={inventoryInput}
            onChange={(e) => setInventoryInput(e.target.value)}
            placeholder="Total de toalhas do hotel"
            className="border rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={saveInventory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
          {stats.stock !== null && stats.stock < 10 && stats.stock >= 0 && (
            <span className="text-sm text-orange-600">
              ⚠️ Estoque baixo! Apenas {stats.stock} toalhas restantes.
            </span>
          )}
        </div>
      </div>

      {/* Resumo do dia - em mobile fica em coluna */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">📅 Resumo de Hoje</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayStats.checkins}</div>
              <div className="text-xs text-gray-500">Check-ins</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{todayStats.checkouts}</div>
              <div className="text-xs text-gray-500">Check-outs</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayStats.towelMovements}</div>
              <div className="text-xs text-gray-500">Mov. toalhas</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">⚠️ Últimas Perdas</h2>
          {losses.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">✅ Nenhuma perda registrada</p>
          ) : (
            <div className="space-y-2">
              {losses.slice(0, 5).map(loss => (
                <div key={loss.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <span className="font-medium">Apto {loss.apt}</span>
                    {loss.guest && <span className="text-gray-500 ml-1">- {loss.guest}</span>}
                  </div>
                  <div className="text-red-600 font-bold">-{loss.lost} toalha(s)</div>
                  <div className="text-xs text-gray-400">{loss.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-800 mb-3">📋 Atividade Recente</h2>
        {todayLogs.slice(0, 10).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma atividade hoje</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center gap-3 text-sm border-b pb-2">
                <span className="text-xs text-gray-400 w-16">{log.time}</span>
                <span className="font-medium w-16">Apto {log.apt}</span>
                <span className="flex-1 text-gray-600">{log.msg}</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded
                  ${log.type === 'checkin' ? 'bg-green-100 text-green-700' : ''}
                  ${log.type === 'checkout' ? 'bg-red-100 text-red-700' : ''}
                  ${log.type === 'towel' ? 'bg-blue-100 text-blue-700' : ''}
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