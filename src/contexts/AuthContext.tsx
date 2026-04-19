// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { setCurrentUser } from '../services/apartmentService';
import { loginUser } from '../services/authService';
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
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', firebaseUser.email));
        const usersSnapshot = await getDocs(q);
        
        let userInfo: User;
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userData = userDoc.data();
          
          userInfo = {
            id: userDoc.id,
            name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: userData.role || 'operator',
            createdAt: userData.createdAt || new Date().toISOString()
          };
        } else {
          // Usuário existe no Auth mas não no Firestore - criar documento
          console.log('📝 Criando documento do usuário no Firestore...');
          userInfo = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: 'operator',
            createdAt: new Date().toISOString()
          };
        }
        
        setUser(userInfo);
        setCurrentUser(userInfo.id, userInfo.name);
        localStorage.setItem('hotel_user', JSON.stringify(userInfo));
        
        if (userInfo.role === 'admin') {
          await refreshUsers();
        }
        
        console.log('✅ Usuário carregado:', userInfo.email);
      } catch (error) {
        console.error('❌ Erro ao carregar usuário do Firestore:', error);
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

  const login = async (email: string, password: string) => {
    console.log('🔐 Iniciando login...');
    setLoading(true);
    
    try {
      // 1. Primeiro, validar no Firestore (seu sistema customizado)
      const loggedUser = await loginUser(email, password);
      console.log('✅ Usuário validado no Firestore');
      
      // 2. Tentar autenticar no Firebase Auth
      try {
        console.log('🔐 Tentando Firebase Auth...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Autenticado no Firebase Auth');
      } catch (authError: any) {
        console.warn('⚠️ Usuário não encontrado no Auth, criando...', authError.code);
        
        // Se o erro for "user not found", criar o usuário
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('✅ Usuário criado no Firebase Auth!');
          } catch (createError: any) {
            console.error('❌ Erro ao criar usuário no Auth:', createError.code);
            // Não falhar o login por causa do Auth
          }
        }
      }
      
      setUser(loggedUser);
      localStorage.setItem('hotel_user', JSON.stringify(loggedUser));
      setCurrentUser(loggedUser.id, loggedUser.name);
      
      console.log('✅ Login completo!');
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw new Error('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('hotel_user');
      setUser(null);
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
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