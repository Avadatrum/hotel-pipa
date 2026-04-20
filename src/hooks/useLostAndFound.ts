// src/hooks/useLostAndFoundData.ts
import { useEffect } from 'react';
import { useLostAndFound } from '../contexts/LostAndFoundContext';
import { useAuth } from '../contexts/AuthContext'; // ADICIONADO

export const useLostAndFoundData = () => {
  const { loadItems, items, loading, filters, setFilters } = useLostAndFound();
  const { user } = useAuth(); // ADICIONADO: Pegar usuário

  useEffect(() => {
    // SÓ CARREGA SE TIVER USUÁRIO AUTENTICADO
    if (!user) {
      return;
    }

    loadItems();
  }, [filters, loadItems, user]); // ADICIONADO: user como dependência

  return {
    items,
    loading,
    filters,
    setFilters,
    refresh: loadItems
  };
};