// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, listUsers } from '../services/authService';
import { setCurrentUser } from '../services/apartmentService'; 
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  users: User[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('hotel_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Importante: Sincronizar com o serviço de apartamentos ao recarregar
      setCurrentUser(parsedUser.id, parsedUser.name);
    }
    setLoading(false);
  }, []);

  // --- FUNÇÃO SUBSTITUÍDA ABAIXO ---

  // Adicione logs para debug
  const refreshUsers = async () => {
    if (user?.role === 'admin') {
      console.log('📝 Atualizando lista de usuários...');
      try {
        const userList = await listUsers();
        console.log('✅ Usuários carregados:', userList.length);
        setUsers(userList);
      } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
      }
    }
  };

  // ----------------------------------

  useEffect(() => {
    if (user?.role === 'admin') {
      refreshUsers();
    }
  }, [user]);

  // Função login atualizada com Logs e tratamento de erro
  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext.login chamado');
    setLoading(true);
    try {
      const loggedUser = await loginUser(email, password);
      console.log('✅ Usuário logado:', loggedUser);
      
      setUser(loggedUser);
      localStorage.setItem('hotel_user', JSON.stringify(loggedUser));
      
      // ESSENCIAL: Define o usuário atual no serviço de apartamentos
      setCurrentUser(loggedUser.id, loggedUser.name);
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      // O erro é relançado para ser tratado pelo componente (ex: exibir toast de erro)
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hotel_user');
    // Recomendado: Limpar o usuário atual no apartmentService
    // setCurrentUser(null, null); 
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