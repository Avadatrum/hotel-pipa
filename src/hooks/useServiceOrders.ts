// src/hooks/useServiceOrders.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listServiceOrders } from '../services/serviceOrderService';
import type { ServiceOrder } from '../types/serviceOrder.types';
import { useToast } from './useToast';

export function useServiceOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadData = async () => {
     if (!user) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await listServiceOrders();
      setOrders(data);
    } catch (err) {
      console.error('Erro ao carregar OS:', err);
      setError(err as Error);
      showToast('Erro ao carregar ordens de serviço', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, showToast]);

  // ✅ ADICIONADO FUNÇÃO REFRESH NOVAMENTE
  const refreshOrders = () => {
    loadData();
  };

  // ✅ ADICIONADO AO RETURN
  return { orders, loading, error, refreshOrders };
}