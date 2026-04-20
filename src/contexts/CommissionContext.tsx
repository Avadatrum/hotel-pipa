// src/contexts/CommissionContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Sale, Tour, Agency, CustomCommission } from '../types';

interface CommissionContextType {
  sales: Sale[];
  tours: Tour[];
  agencies: Agency[];
  customCommissions: CustomCommission[];
  loading: boolean;
  totalCommissions: number;
  refreshData: () => void;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export function CommissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [customCommissions, setCustomCommissions] = useState<CustomCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SÓ CARREGA SE TIVER USUÁRIO AUTENTICADO
    if (!user) {
      console.log('⏸️ CommissionContext: Usuário não autenticado.');
      setLoading(false);
      // Limpa dados ao sair
      setSales([]);
      setTours([]);
      setAgencies([]);
      setCustomCommissions([]);
      return;
    }

    console.log('🔄 CommissionContext: Iniciando listeners...');
    setLoading(true);
    
    const unsubscribers: (() => void)[] = [];
    
    // Flag para garantir que todos os listeners tenham respondido pelo menos uma vez
    // (Simples contagem de quantas chamadas de sucesso esperamos)
    let completedListeners = 0;
    // Esperamos: Sales, Tours, CustomCommissions + (Agencies se for admin)
    const expectedListeners = user.role === 'admin' ? 4 : 3;

    const checkLoadingComplete = () => {
      completedListeners++;
      if (completedListeners >= expectedListeners) {
        setLoading(false);
      }
    };

    try {
      // Vendas - Ordenação manual no cliente para evitar erros de índice no Firestore
      const qSales = query(collection(db, 'sales'));
      const unsubSales = onSnapshot(
        qSales,
        (snap) => {
          const salesData = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
          // Ordenar manualmente: mais recente primeiro
          salesData.sort((a, b) => {
            const dateA = a.dataVenda?.toDate?.() ? new Date(a.dataVenda) : new Date();
            const dateB = b.dataVenda?.toDate?.() ? new Date(b.dataVenda) : new Date();
            return dateB.getTime() - dateA.getTime();
          });
          setSales(salesData);
          checkLoadingComplete();
        },
        (err) => {
          console.error('Erro no listener de sales:', err);
          checkLoadingComplete(); // Considera completo mesmo com erro para não travar loading
        }
      );
      unsubscribers.push(unsubSales);

      // Tours
      const qTours = query(collection(db, 'tours'));
      const unsubTours = onSnapshot(qTours, 
        (snap) => {
          setTours(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Tour[]);
          checkLoadingComplete();
        },
        (err) => {
          console.error('Erro no listener de tours:', err);
          checkLoadingComplete();
        }
      );
      unsubscribers.push(unsubTours);

      // Agências (só admin)
      if (user.role === 'admin') {
        const qAgencies = query(collection(db, 'agencies'));
        const unsubAgencies = onSnapshot(qAgencies, 
          (snap) => {
            setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Agency[]);
            checkLoadingComplete();
          },
          (err) => {
            console.error('Erro no listener de agencies:', err);
            checkLoadingComplete();
          }
        );
        unsubscribers.push(unsubAgencies);
      }

      // Comissões personalizadas
      const qComm = query(collection(db, 'customCommissions'));
      const unsubComm = onSnapshot(qComm, 
        (snap) => {
          setCustomCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CustomCommission[]);
          checkLoadingComplete();
        },
        (err) => {
          console.error('Erro no listener de customCommissions:', err);
          checkLoadingComplete();
        }
      );
      unsubscribers.push(unsubComm);

    } catch (error) {
      console.error('Erro crítico ao configurar listeners:', error);
      setLoading(false);
    }
    
    // Cleanup: para todos os listeners ao desmontar ou mudar user
    return () => {
      console.log('🛑 CommissionContext: Limpando listeners...');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]); // Dependência: User

  const totalCommissions = sales
    .filter(s => s.status === 'confirmada')
    .reduce((sum, s) => sum + s.comissaoCalculada, 0);

  const refreshData = () => {
    // Como usamos onSnapshot (tempo real), os dados já estão atualizados.
    // Esta função pode ser usada apenas para forçar um re-render se necessário,
    // ou para resetar estados visuais. Mas tecnicamente o listener já é "refresh".
    setLoading(true);
    // Simulamos um pequeno delay para feedback visual
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <CommissionContext.Provider value={{ 
      sales, 
      tours, 
      agencies, 
      customCommissions, 
      loading, 
      totalCommissions, 
      refreshData 
    }}>
      {children}
    </CommissionContext.Provider>
  );
}

export function useCommissions() {
  const ctx = useContext(CommissionContext);
  if (!ctx) throw new Error('useCommissions must be used within CommissionProvider');
  return ctx;
}