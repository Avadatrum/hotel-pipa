// src/hooks/useServiceOrders.ts - CORRIGIDO COM TEMPO REAL
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ServiceOrder } from '../types/serviceOrder.types';
import { useToast } from './useToast';

export function useServiceOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) {
      console.log('⏸️ useServiceOrders: Aguardando autenticação...');
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🔄 useServiceOrders: Iniciando listener em tempo real...');
    setLoading(true);

    // Query com ordenação por timestamp
    const q = query(
      collection(db, 'serviceOrders'),
      orderBy('ts', 'desc')
    );

    // 🔥 onSnapshot = tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: ServiceOrder[] = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as ServiceOrder);
      });
      
      console.log(`✅ useServiceOrders: ${ordersList.length} OS carregadas`);
      setOrders(ordersList);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('❌ Erro no listener de OS:', err);
      setError(err as Error);
      showToast('Erro ao carregar ordens de serviço', 'error');
      setLoading(false);
    });

    // Cleanup ao desmontar
    return () => {
      console.log('🛑 useServiceOrders: Limpando listener...');
      unsubscribe();
    };
  }, [user, showToast]);

  // 🔄 Função refresh mantida para compatibilidade
  const refreshOrders = () => {
    // Não precisa fazer nada, onSnapshot já mantém atualizado
    console.log('ℹ️ refreshOrders chamado, mas onSnapshot já está ativo');
  };

  return { orders, loading, error, refreshOrders };
}