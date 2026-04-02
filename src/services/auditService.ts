// src/services/auditService.ts
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

// Função para adicionar informações de auditoria a um objeto
export function addAuditInfo<T extends Record<string, any>>(
  data: T,
  userId: string,
  userName: string
): T & { userId: string; userName: string } {
  return {
    ...data,
    userId,
    userName,
  };
}

// Função para registrar ação em coleção com auditoria
export async function addWithAudit<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  userId: string,
  userName: string
): Promise<string> {
  const auditData = addAuditInfo(data, userId, userName);
  const docRef = await addDoc(collection(db, collectionName), auditData);
  return docRef.id;
}

// Função para atualizar com auditoria (opcional)
export async function updateWithAudit(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  userId: string,
  userName: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedBy: userId,
    updatedByName: userName,
    updatedAt: new Date().toISOString(),
  });
}