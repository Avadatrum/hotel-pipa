// src/contexts/CommissionContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
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
    if (!user) return;

    // Listener para vendas
    const salesQuery = query(
      collection(db, 'sales'),
      orderBy('dataVenda', 'desc')
    );

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesData);
      setLoading(false);
    });

    // Listener para passeios
    const toursQuery = query(
      collection(db, 'tours'),
      where('ativo', '==', true)
    );

    const unsubscribeTours = onSnapshot(toursQuery, (snapshot) => {
      const toursData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tour[];
      setTours(toursData);
    });

    // Listener para agências (apenas admin vê todas)
    let unsubscribeAgencies: () => void = () => {};
    if (user?.role === 'admin') {
      const agenciesQuery = query(collection(db, 'agencies'), orderBy('nome'));
      unsubscribeAgencies = onSnapshot(agenciesQuery, (snapshot) => {
        const agenciesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Agency[];
        setAgencies(agenciesData);
      });
    }

    // Listener para comissões personalizadas
    const commissionsQuery = query(
      collection(db, 'customCommissions'),
      where('dataFim', '==', null)
    );

    const unsubscribeCommissions = onSnapshot(commissionsQuery, (snapshot) => {
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomCommission[];
      setCustomCommissions(commissionsData);
    });

    return () => {
      unsubscribeSales();
      unsubscribeTours();
      unsubscribeAgencies();
      unsubscribeCommissions();
    };
  }, [user]);

  const totalCommissions = sales
    .filter(s => s.status === 'confirmada')
    .reduce((sum, sale) => sum + sale.comissaoCalculada, 0);

  const refreshData = () => {
    setLoading(true);
    // Os listeners vão atualizar automaticamente
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
  const context = useContext(CommissionContext);
  if (!context) {
    throw new Error('useCommissions must be used within CommissionProvider');
  }
  return context;
}