import { useEffect } from 'react';
import { useLostAndFound } from '../contexts/LostAndFoundContext';

export const useLostAndFoundData = () => {
  const { loadItems, items, loading, filters, setFilters } = useLostAndFound();

  useEffect(() => {
    loadItems();
  }, [filters, loadItems]);

  return {
    items,
    loading,
    filters,
    setFilters,
    refresh: loadItems
  };
};