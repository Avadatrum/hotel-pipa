// src/hooks/useLostAndFoundData.ts
import { useEffect, useCallback } from 'react';
import { useLostAndFound } from '../contexts/LostAndFoundContext';
import { useAuth } from '../contexts/AuthContext';

export const useLostAndFoundData = () => {
  const { loadItems, items, loading, filters, setFilters } = useLostAndFound();
  const { user } = useAuth();

  // 🎯 Memoize loadItems para evitar recriação
  const memoizedLoadItems = useCallback(() => {
    if (user) {
      loadItems();
    }
  }, [loadItems, user]);

  useEffect(() => {
    memoizedLoadItems();
  }, [filters, memoizedLoadItems]);

  return {
    items,
    loading,
    filters,
    setFilters,
    refresh: memoizedLoadItems
  };
};