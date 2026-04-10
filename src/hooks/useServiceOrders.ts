// src/hooks/useServiceOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  QueryConstraint
} from 'firebase/firestore';
import type { ServiceOrder, OSFilters } from '../types/serviceOrder.types';
import { useToast } from './useToast';

export function useServiceOrders(initialFilters?: OSFilters) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OSFilters | undefined>(initialFilters);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    
    const constraints: QueryConstraint[] = [orderBy('ts', 'desc')];
    
    // Aplicar filtros (Removida a lógica de prioridade)
    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    
    const q = query(collection(db, 'serviceOrders'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersList: ServiceOrder[] = [];
        snapshot.forEach((doc) => {
          ordersList.push({ id: doc.id, ...doc.data() } as ServiceOrder);
        });
        setOrders(ordersList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erro ao carregar OS:', err);
        setError('Erro ao carregar ordens de serviço');
        setLoading(false);
        showToast('Erro ao carregar OS', 'error');
      }
    );
    
    return () => unsubscribe();
  }, [filters, showToast]);

  const refreshOrders = useCallback(() => {
    // O onSnapshot já atualiza em tempo real
  }, []);

  const applyFilters = useCallback((newFilters: OSFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(undefined);
  }, []);

  const getOrderById = useCallback((id: string) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: ServiceOrder['status']) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  const getOrdersByExecutor = useCallback((executorId: string) => {
    return orders.filter(o => o.executorId === executorId);
  }, [orders]);

  const getStatistics = useCallback(() => {
    const now = new Date();
    const thisMonth = orders.filter(o => {
      const created = new Date(o.dataCriacao);
      return created.getMonth() === now.getMonth() && 
             created.getFullYear() === now.getFullYear();
    });

    return {
      total: orders.length,
      abertas: orders.filter(o => o.status === 'aberta').length,
      emAndamento: orders.filter(o => o.status === 'em_andamento').length,
      concluidas: orders.filter(o => o.status === 'concluida').length,
      canceladas: orders.filter(o => o.status === 'cancelada').length,
      thisMonth: thisMonth.length,
      // Removida a propriedade 'altaPrioridade'
    };
  }, [orders]);

  return {
    orders,
    loading,
    error,
    filters,
    applyFilters,
    clearFilters,
    refreshOrders,
    getOrderById,
    getOrdersByStatus,
    getOrdersByExecutor,
    getStatistics,
  };
}