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
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // ✅ CORREÇÃO: Usar try/catch e tratamento de erros
    const unsubscribers: (() => void)[] = [];

    try {
      // Vendas - sem orderBy inicial para evitar erro de índice
      const qSales = query(collection(db, 'sales'));
      const unsubSales = onSnapshot(
        qSales,
        (snap) => {
          const salesData = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
          // Ordenar manualmente no cliente
          salesData.sort((a, b) => {
            const dateA = a.dataVenda?.toDate?.() || new Date(a.dataVenda);
            const dateB = b.dataVenda?.toDate?.() || new Date(b.dataVenda);
            return dateB.getTime() - dateA.getTime();
          });
          setSales(salesData);
        },
        (err) => {
          console.error('Erro no listener de sales:', err);
          // Se for erro de índice, tentar sem ordenação
          if (err.code === 'failed-precondition') {
            const fallbackQuery = query(collection(db, 'sales'));
            onSnapshot(fallbackQuery, (snap) => {
              setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[]);
            });
          }
        }
      );
      unsubscribers.push(unsubSales);

      // Tours
      const qTours = query(collection(db, 'tours'));
      const unsubTours = onSnapshot(qTours, (snap) => {
        setTours(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Tour[]);
      });
      unsubscribers.push(unsubTours);

      // Agências (só admin)
      if (user.role === 'admin') {
        const qAgencies = query(collection(db, 'agencies'));
        const unsubAgencies = onSnapshot(qAgencies, (snap) => {
          setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Agency[]);
        });
        unsubscribers.push(unsubAgencies);
      }

      // Comissões personalizadas
      const qComm = query(collection(db, 'customCommissions'));
      const unsubComm = onSnapshot(qComm, (snap) => {
        setCustomCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CustomCommission[]);
      });
      unsubscribers.push(unsubComm);

      // Timer para evitar loading infinito
      const timer = setTimeout(() => setLoading(false), 1000);
      
      return () => {
        clearTimeout(timer);
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Erro ao configurar listeners:', error);
      setLoading(false);
    }
  }, [user]);

  const totalCommissions = sales
    .filter(s => s.status === 'confirmada')
    .reduce((sum, s) => sum + s.comissaoCalculada, 0);

  const refreshData = () => {
    setLoading(true);
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