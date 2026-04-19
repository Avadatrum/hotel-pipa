// src/services/authService.ts
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import type { User } from '../types';

const COLLECTION = 'users';

// Função hash (DEVE SER IDÊNTICA à usada no banco)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

// Hash de senha (Helper para criação de usuários)
export async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

// Login
export async function loginUser(email: string, password: string): Promise<any> {
  console.log('🔍 loginUser chamado com:', { email });
  
  // ⚠️ BYPASS TEMPORÁRIO - REMOVA DEPOIS
  if (email === 'wemerson@hoteldapipa.com' && password === '230704') {
    console.log('⚠️ Login via bypass!');
    return {
      id: 'admin_temp',
      name: 'Wemerson',
      email: email,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
  }
  
  // Código original continua aqui...
  const usersRef = collection(db, COLLECTION);
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  console.log('📝 Documentos encontrados:', querySnapshot.size);
  
  if (querySnapshot.empty) {
    console.error('❌ Usuário não encontrado:', email);
    throw new Error('Usuário não encontrado');
  }
  
  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();
  const passwordHash = simpleHash(password);
  
  console.log('🔑 Hash gerado:', passwordHash);
  console.log('🔑 Hash armazenado:', userData.passwordHash);
  
  if (userData.passwordHash !== passwordHash) {
    console.error('❌ Senha incorreta');
    throw new Error('Senha incorreta');
  }
  
  console.log('✅ Login bem sucedido!');
  
  return {
    id: userDoc.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    createdAt: userData.createdAt,
  };
}

// Criar usuário (apenas admin)
export async function createUser(userData: any, password: string, createdBy: string): Promise<string> {
  console.log('📝 createUser chamado:', { userData, createdBy });
  
  try {
    const usersRef = collection(db, COLLECTION);
    const passwordHash = simpleHash(password);
    
    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
    };
    
    console.log('📝 Novo usuário a ser salvo:', newUser);
    
    const docRef = await addDoc(usersRef, newUser);
    console.log('✅ Usuário criado com ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro detalhado ao criar usuário:', error);
    throw new Error(`Erro ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Listar todos os usuários
export async function listUsers(): Promise<User[]> {
  const usersRef = collection(db, COLLECTION);
  const querySnapshot = await getDocs(usersRef);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    role: doc.data().role,
    createdAt: doc.data().createdAt,
    createdBy: doc.data().createdBy,
  }));
}

// Atualizar usuário
export async function updateUser(userId: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
  const userRef = doc(db, COLLECTION, userId);
  await updateDoc(userRef, data);
}

// Resetar senha
export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const userRef = doc(db, COLLECTION, userId);
  // Usa a nova lógica de hash
  const passwordHash = await hashPassword(newPassword);
  await updateDoc(userRef, { passwordHash });
}

// Deletar usuário
export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(db, COLLECTION, userId);
  await deleteDoc(userRef);
}

// Verificar se é o último admin
export async function isLastAdmin(userId: string): Promise<boolean> {
  const users = await listUsers();
  const admins = users.filter(u => u.role === 'admin');
  return admins.length === 1 && admins[0].id === userId;
}

// Resetar senha de qualquer usuário (apenas admin)
export async function adminResetUserPassword(userEmail: string, newPassword: string): Promise<void> {
  // Busca o usuário pelo email para obter o ID
  const usersRef = collection(db, COLLECTION);
  const q = query(usersRef, where('email', '==', userEmail.toLowerCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Usuário não encontrado para resetar senha');
  }

  const userDoc = querySnapshot.docs[0];
  const userRef = doc(db, COLLECTION, userDoc.id);

  // Gera o hash da nova senha
  const passwordHash = await hashPassword(newPassword);

  // Atualiza diretamente no banco de dados
  await updateDoc(userRef, { passwordHash });
}