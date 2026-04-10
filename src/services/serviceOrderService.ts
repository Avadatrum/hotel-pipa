import { db } from './firebase';
import { 
  collection, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  orderBy, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { addWithAudit, updateWithAudit } from './auditService';
import type { 
  ServiceOrder, 
  OSFormData, 
  OSHistoryEntry,
  OSFilters 
} from '../types/serviceOrder.types';
import { generateOSNumber } from '../utils/osHelpers';

// Variáveis globais para usuário atual (setadas pelo AuthContext)
let currentUserId = '';
let currentUserName = '';

export function setOSCurrentUser(userId: string, userName: string) {
  currentUserId = userId;
  currentUserName = userName;
}

// Coleção principal
const OS_COLLECTION = 'serviceOrders';

// Criar nova OS
export async function createServiceOrder(data: OSFormData): Promise<string> {
  try {
    // Gerar número sequencial
    const existingOrders = await getDocs(collection(db, OS_COLLECTION));
    const existingNumbers = existingOrders.docs.map(doc => doc.data().numero);
    const numero = generateOSNumber(existingNumbers);
    
    const now = new Date().toISOString();
    const ts = Date.now();
    
    const historico: OSHistoryEntry[] = [{
      id: `hist_${ts}_${Math.random().toString(36).substr(2, 9)}`,
      acao: 'Criação',
      descricao: `OS criada por ${currentUserName}`,
      usuarioId: currentUserId,
      usuarioNome: currentUserName,
      data: now,
      ts,
      statusNovo: 'aberta'
    }];
    
    const orderData: Omit<ServiceOrder, 'id'> = {
      numero,
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      local: data.local, // 🆕 Campo único
      status: 'aberta',
      // 🗑️ REMOVIDO: prioridade
      dataCriacao: now,
      dataAtualizacao: now,
      prazo: data.prazo,
      solicitanteId: currentUserId,
      solicitanteNome: currentUserName,
      solicitanteSetor: data.solicitanteSetor,
      executorId: data.executorId,
      executorNome: data.executorNome,
      equipe: data.equipe,
      observacoes: data.observacoes,
      // 🗑️ REMOVIDO: custoEstimado
      historico,
      criadoPor: currentUserId,
      criadoPorNome: currentUserName,
      ts
    };
    
    const id = await addWithAudit(OS_COLLECTION, orderData, currentUserId, currentUserName);
    return id;
  } catch (error) {
    console.error('Erro ao criar OS:', error);
    throw error;
  }
}

// Atualizar OS
export async function updateServiceOrder(
  orderId: string, 
  updates: Partial<ServiceOrder>
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const ts = Date.now();
    
    // Buscar OS atual para histórico
    const orderRef = doc(db, OS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    const currentOrder = orderSnap.data() as ServiceOrder;
    
    // Adicionar entrada no histórico se houver mudança de status
    const historico = currentOrder.historico || [];
    if (updates.status && updates.status !== currentOrder.status) {
      historico.push({
        id: `hist_${ts}_${Math.random().toString(36).substr(2, 9)}`,
        acao: 'Mudança de Status',
        descricao: `Status alterado de "${currentOrder.status}" para "${updates.status}"`,
        usuarioId: currentUserId,
        usuarioNome: currentUserName,
        data: now,
        ts,
        statusAnterior: currentOrder.status,
        statusNovo: updates.status
      });
    }
    
    const updateData = {
      ...updates,
      historico,
      dataAtualizacao: now,
      atualizadoPor: currentUserId,
      atualizadoPorNome: currentUserName,
      ...(updates.status === 'concluida' && { dataConclusao: now })
    };
    
    await updateWithAudit(OS_COLLECTION, orderId, updateData, currentUserId, currentUserName);
  } catch (error) {
    console.error('Erro ao atualizar OS:', error);
    throw error;
  }
}

// Adicionar comentário/histórico
export async function addOSComment(
  orderId: string,
  acao: string,
  descricao: string
): Promise<void> {
  try {
    const orderRef = doc(db, OS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data() as ServiceOrder;
    
    const now = new Date().toISOString();
    const ts = Date.now();
    
    const newEntry: OSHistoryEntry = {
      id: `hist_${ts}_${Math.random().toString(36).substr(2, 9)}`,
      acao,
      descricao,
      usuarioId: currentUserId,
      usuarioNome: currentUserName,
      data: now,
      ts
    };
    
    const historico = [...(order.historico || []), newEntry];
    
    await updateDoc(orderRef, {
      historico,
      dataAtualizacao: now,
      atualizadoPor: currentUserId,
      atualizadoPorNome: currentUserName
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw error;
  }
}

// Buscar OS por ID
export async function getServiceOrder(orderId: string): Promise<ServiceOrder | null> {
  try {
    const orderRef = doc(db, OS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() } as ServiceOrder;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar OS:', error);
    throw error;
  }
}

// Listar OS com filtros
export async function listServiceOrders(filters?: OSFilters): Promise<ServiceOrder[]> {
  try {
    let q = query(collection(db, OS_COLLECTION), orderBy('ts', 'desc'));
    
    // Aplicar filtros (simplificado - ajustar conforme necessidade)
    if (filters?.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ServiceOrder));
  } catch (error) {
    console.error('Erro ao listar OS:', error);
    throw error;
  }
}

// Excluir OS
export async function deleteServiceOrder(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, OS_COLLECTION, orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Erro ao excluir OS:', error);
    throw error;
  }
}

// Buscar estatísticas
export async function getOSStatistics(): Promise<any> {
  try {
    const orders = await listServiceOrders();
    const now = new Date();
    const thisMonth = orders.filter(o => {
      const created = new Date(o.dataCriacao);
      return created.getMonth() === now.getMonth() && 
             created.getFullYear() === now.getFullYear();
    });
    
    return {
      total: orders.length,
      thisMonth: thisMonth.length,
      byStatus: {
        aberta: orders.filter(o => o.status === 'aberta').length,
        em_andamento: orders.filter(o => o.status === 'em_andamento').length,
        concluida: orders.filter(o => o.status === 'concluida').length,
        cancelada: orders.filter(o => o.status === 'cancelada').length,
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
}