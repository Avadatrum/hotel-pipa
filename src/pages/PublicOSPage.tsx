import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { ServiceOrder } from '../types/serviceOrder.types';
// OSPriorityBadge removido
import { getOSTipoIcon, getOSTipoLabel, formatOSDate } from '../utils/osHelpers';

export function PublicOSPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Buscar apenas OS abertas e em andamento
    const q = query(
      collection(db, 'serviceOrders'),
      where('status', 'in', ['aberta', 'em_andamento']),
      orderBy('ts', 'desc') // Apenas por data
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const osList: ServiceOrder[] = [];
      snapshot.forEach((doc) => {
        osList.push({ id: doc.id, ...doc.data() } as ServiceOrder);
      });
      setOrders(osList);
      setLoading(false);
      setLastUpdate(new Date());
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    return status === 'aberta' 
      ? 'bg-blue-100 text-blue-700 border-blue-300' 
      : 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  const getStatusLabel = (status: string) => {
    return status === 'aberta' ? '🔴 Aguardando' : '🟡 Em Andamento';
  };

  // getPriorityBorder removido

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔧</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  const abertas = orders.filter(o => o.status === 'aberta').length;
  const emAndamento = orders.filter(o => o.status === 'em_andamento').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🔧</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Ordens de Serviço Ativas
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  🔴 {abertas} Aguardando
                </span>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  🟡 {emAndamento} Em andamento
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de OS */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Nenhuma OS ativa!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Todas as ordens de serviço foram concluídas. 😊
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="
                  bg-white dark:bg-gray-800 rounded-xl shadow-md 
                  border border-gray-200 dark:border-gray-700 
                  overflow-hidden transition-all duration-200
                  hover:shadow-lg
                "
              >
                <div className="p-4">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        {order.numero}
                      </span>
                      {/* OSPriorityBadge REMOVIDO */}
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}
                      `}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatOSDate(order.dataCriacao)}
                    </span>
                  </div>

                  {/* Título e Tipo */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {order.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{getOSTipoIcon(order.tipo)}</span>
                      <span>{getOSTipoLabel(order.tipo)}</span>
                      <span className="text-gray-400">•</span>
                      {/* Substituído order.localNome por order.local */}
                      <span>📍 {order.local}</span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {order.descricao}
                  </p>

                  {/* Rodapé */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {order.solicitanteNome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {order.solicitanteNome}
                        </span>
                      </div>
                      
                      {order.executorNome && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                {order.executorNome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 text-sm">
                              {order.executorNome}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {order.prazo && (
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Prazo: </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatOSDate(order.prazo)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Observações (se houver) */}
                  {order.observacoes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📝 {order.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            HPanel - Sistema de Gestão Hoteleira • Atualização em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}