// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; // Mantido para o listener de estado
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { setCurrentUser } from '../services/apartmentService';
import { loginUser } from '../services/authService'; // Importação adicionada
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  users: User[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Buscar dados do Firestore pelo email
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let userData: any = null;
        let userDocId: string = '';
        
        usersSnapshot.forEach((document) => {
          const data = document.data();
          if (data.authUid === firebaseUser.uid || data.email === firebaseUser.email) {
            userData = data;
            userDocId = document.id;
          }
        });
        
        if (!userData) {
          // Se não encontrou, criar um novo documento
          console.log('📝 Criando novo usuário no Firestore...');
          userData = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: 'operator',
            createdAt: new Date().toISOString(),
            authUid: firebaseUser.uid
          };
        }
        
        const userInfo: User = {
          id: userDocId || firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
          email: firebaseUser.email || '',
          role: userData.role || 'operator',
          createdAt: userData.createdAt || new Date().toISOString()
        };
        
        setUser(userInfo);
        setCurrentUser(userInfo.id, userInfo.name);
        localStorage.setItem('hotel_user', JSON.stringify(userInfo));
        
        if (userInfo.role === 'admin') {
          await refreshUsers();
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUsers = async () => {
    console.log('📝 Atualizando lista de usuários...');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList: User[] = [];
      usersSnapshot.forEach((document) => {
        const data = document.data();
        userList.push({ 
          id: document.id, 
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt
        } as User);
      });
      console.log('✅ Usuários carregados:', userList.length);
      setUsers(userList);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
    }
  };

  // Função de Login atualizada conforme solicitado
  const login = async (email: string, password: string) => {
    console.log('🔐 Iniciando login...');
    setLoading(true);
    
    try {
      // 1. Login no sistema customizado (Firestore)
      const loggedUser = await loginUser(email, password);
      console.log('✅ Usuário validado no Firestore');
      
      // 2. 🆕 Autenticar também no Firebase Auth
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Autenticado no Firebase Auth');
      } catch (authError: any) {
        // Se senha estiver errada no Auth, usar a mesma senha
        console.warn('⚠️ Usuário não autenticado no Auth, tentando criar...');
        
        // Criar usuário no Auth com a mesma senha
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('✅ Usuário criado no Firebase Auth!');
        } catch (createError) {
          console.error('❌ Não foi possível criar usuário no Auth:', createError);
        }
      }
      
      setUser(loggedUser);
      localStorage.setItem('hotel_user', JSON.stringify(loggedUser));
      setCurrentUser(loggedUser.id, loggedUser.name);
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
      localStorage.removeItem('hotel_user');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      users,
      refreshUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}