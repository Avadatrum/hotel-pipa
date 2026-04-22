// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { setCurrentUser } from '../services/apartmentService';
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
        console.log('🔥 Firebase User autenticado:', firebaseUser.email);

        await firebaseUser.getIdToken(true);

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
            role: (userData.role as 'admin' | 'operator') || 'operator',
            createdAt: userData.createdAt || new Date().toISOString()
          };

          console.log('✅ Dados do usuário carregados:', userInfo);
        } else {
          // Usuário existe no Auth mas não no Firestore — criar registro
          console.log('📝 Usuário não encontrado no Firestore, criando...');

          const newUser = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: 'operator' as const,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          };

          const docRef = await addDoc(collection(db, 'users'), newUser);
          userInfo = { id: docRef.id, ...newUser };

          console.log('✅ Usuário criado no Firestore:', userInfo);
        }

        setUser(userInfo);
        setCurrentUser(userInfo.id, userInfo.name);
        localStorage.setItem('hotel_user', JSON.stringify(userInfo));

        if (userInfo.role === 'admin') {
          await refreshUsers();
        }

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
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList: User[] = usersSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: data.name,
          email: data.email,
          role: data.role as 'admin' | 'operator',
          createdAt: data.createdAt,
        };
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
      // ✅ FLUXO CORRETO: Firebase Auth é a fonte da verdade
      // Se a senha estiver errada, lança exceção aqui e para tudo.
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login no Firebase Auth realizado com sucesso');
      // O onAuthStateChanged acima cuida do resto (buscar dados no Firestore)

    } catch (error: any) {
      console.error('❌ Erro no login:', error.code);

      // Traduzir erros do Firebase para mensagens amigáveis em PT-BR
      const messages: Record<string, string> = {
        'auth/invalid-credential':  'E-mail ou senha incorretos.',
        'auth/user-not-found':      'Nenhum usuário encontrado com este e-mail.',
        'auth/wrong-password':      'Senha incorreta. Tente novamente.',
        'auth/invalid-email':       'Formato de e-mail inválido.',
        'auth/user-disabled':       'Este usuário foi desativado. Fale com o administrador.',
        'auth/too-many-requests':   'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
      };

      const message = messages[error.code] ?? 'Erro ao fazer login. Tente novamente.';
      throw new Error(message);

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
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, users, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}