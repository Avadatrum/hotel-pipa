// src/contexts/LostAndFoundContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { LostItem, LostItemFilters, LostItemFormData } from '../types/lostAndFound.types';
import * as lostAndFoundService from '../services/lostAndFoundService';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';

interface LostAndFoundContextType {
  items: LostItem[];
  loading: boolean;
  filters: LostItemFilters;
  setFilters: (filters: LostItemFilters) => void;
  loadItems: () => Promise<void>;
  createItem: (data: LostItemFormData) => Promise<LostItem | null>;
  updateItem: (id: string, data: Partial<LostItem>, photo?: File) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markAsReturned: (id: string, returnedTo: string) => Promise<void>;
  markAsDiscarded: (id: string) => Promise<void>;
  getItem: (id: string) => Promise<LostItem | null>;
  generateLabel: (item: LostItem) => string;
}

const LostAndFoundContext = createContext<LostAndFoundContextType | undefined>(undefined);

export const useLostAndFound = () => {
  const context = useContext(LostAndFoundContext);
  if (!context) {
    throw new Error('useLostAndFound must be used within LostAndFoundProvider');
  }
  return context;
};

export const LostAndFoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LostItemFilters>({});
  const { user } = useAuth();
  const { showToast } = useToast();

  // CARREGAR ITENS AUTOMATICAMENTE AO INICIAR (OU QUANDO USUÁRIO MUDAR)
  useEffect(() => {
    if (!user) {
      console.log('⏸️ Aguardando autenticação para carregar itens...');
      setItems([]); 
      return;
    }
    
    console.log('🔄 Usuário autenticado. Carregando itens...');
    loadItems();
  }, [user]);

  const loadItems = useCallback(async () => {
    if (!user) {
      console.log('⚠️ Usuário não autenticado, cancelando carregamento.');
      return;
    }

    setLoading(true);
    try {
      console.log('📦 Buscando itens do Firestore com filtros:', filters);
      const fetchedItems = await lostAndFoundService.getLostItems(filters);
      console.log(`✅ ${fetchedItems.length} itens carregados`);
      setItems(fetchedItems);
    } catch (error) {
      console.error('❌ Error loading items:', error);
      showToast('Erro ao carregar itens', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast, user]);

  const createItem = async (data: LostItemFormData): Promise<LostItem | null> => {
    if (!user) {
      showToast('Usuário não autenticado', 'error');
      return null;
    }

    try {
      const newItem = await lostAndFoundService.createLostItem(data, user.id);
      showToast(`Item ${newItem.uniqueCode} cadastrado com sucesso!`, 'success');
      
      setItems(prevItems => [newItem, ...prevItems]);
      await loadItems();
      
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      showToast('Erro ao cadastrar item', 'error');
      return null;
    }
  };

  const updateItem = async (id: string, data: Partial<LostItem>, photo?: File) => {
    console.log('📝 Context: Atualizando item', { id, hasPhoto: !!photo });
    
    try {
      // 🆕 REMOVER campos de arquivo e IDs antes de enviar para o Firestore
      const { photo: photoField, photos: photosField, photoURL, id: itemId, createdAt, ...updateData } = data as any;
      
      // ✅ CORREÇÃO APLICADA: Envia o 'photo' diretamente para o serviço
      await lostAndFoundService.updateLostItem(id, updateData, photo);
      
      showToast('Item atualizado com sucesso!', 'success');
      
      // Aguardar o Firestore processar a propagação dos dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recarregar lista para refletir mudanças
      await loadItems();
      
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Erro ao atualizar item', 'error');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await lostAndFoundService.deleteLostItem(id);
      showToast('Item removido com sucesso!', 'success');
      
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Erro ao remover item', 'error');
    }
  };

  const markAsReturned = async (id: string, returnedTo: string) => {
    try {
      await lostAndFoundService.markAsReturned(id, returnedTo);
      showToast('Item marcado como entregue!', 'success');
      await loadItems();
    } catch (error) {
      console.error('Error marking as returned:', error);
      showToast('Erro ao marcar item como entregue', 'error');
    }
  };

  const markAsDiscarded = async (id: string) => {
    try {
      await lostAndFoundService.markAsDiscarded(id);
      showToast('Item marcado como descartado!', 'success');
      await loadItems();
    } catch (error) {
      console.error('Error marking as discarded:', error);
      showToast('Erro ao marcar item como descartado', 'error');
    }
  };

  const getItem = async (id: string) => {
    return await lostAndFoundService.getLostItem(id);
  };

  const generateLabel = (item: LostItem): string => {
    return `
      =================================
      HOTEL PIPA - ACHADOS E PERDIDOS
      =================================
      
      Código: ${item.uniqueCode}
      Data: ${item.foundDate.toLocaleDateString('pt-BR')}
      Categoria: ${item.category}
      Descrição: ${item.description}
      Cor: ${item.color || 'N/A'}
      Local: ${item.foundLocation}
      Entregue por: ${item.deliveredBy}
      Status: ${item.status === 'guardado' ? 'AGUARDANDO' : item.status === 'entregue' ? 'ENTREGUE' : 'DESCARTADO'}
      
      =================================
    `;
  };

  return (
    <LostAndFoundContext.Provider value={{
      items,
      loading,
      filters,
      setFilters,
      loadItems,
      createItem,
      updateItem,
      deleteItem,
      markAsReturned,
      markAsDiscarded,
      getItem,
      generateLabel
    }}>
      {children}
    </LostAndFoundContext.Provider>
  );
};