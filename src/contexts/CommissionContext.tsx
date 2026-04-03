// src/contexts/CommissionContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
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

    setLoading(true);

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
    }, (error) => {
        console.error("Erro no listener de vendas:", error);
    });

    // Listener para passeios
    // Se o campo 'ativo' não existir em todos os documentos, essa query pode falhar silenciosamente.
    // Tentei manter sua query, mas se der erro, remova o where('ativo'...)
    let toursQuery;
    try {
        toursQuery = query(
          collection(db, 'tours'),
          where('ativo', '==', true)
        );
    } catch (e) {
        // Fallback se o índice não existir ou campo faltar
        toursQuery = query(collection(db, 'tours'));
    }

    const unsubscribeTours = onSnapshot(toursQuery, (snapshot) => {
      const toursData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tour[];
      setTours(toursData);
    }, (error) => {
        console.error("Erro no listener de tours:", error);
    });

    // Listener para agências
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

    // --- CORREÇÃO AQUI ---
    // Listener para comissões personalizadas
    // REMOVI o where('dataFim', '==', null) para evitar erros de índice e garantir que recebemos tudo.
    // O filtro de "ativo" vamos fazer na mão (em memória) ou usar no componente.
    const commissionsQuery = query(collection(db, 'customCommissions'), orderBy('dataInicio', 'desc'));

    const unsubscribeCommissions = onSnapshot(commissionsQuery, (snapshot) => {
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomCommission[];
      
      setCustomCommissions(commissionsData);
    }, (error) => {
        console.error("Erro no listener de comissões:", error);
    });

    // Quando todos os listeners iniciarem (o primeiro evento de cada), paramos o loading global
    // Como onSnapshot é assíncrono, podemos usar um timeout pequeno ou confiar no primeiro update.
    // Para simplificar, deixamos o loading false após um momento ou no primeiro sales.
    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
      clearTimeout(timer);
      unsubscribeSales();
      unsubscribeTours();
      unsubscribeAgencies();
      unsubscribeCommissions();
    };
  }, [user]); // Dependência apenas no user

  const totalCommissions = sales
    .filter(s => s.status === 'confirmada')
    .reduce((sum, sale) => sum + sale.comissaoCalculada, 0);

  const refreshData = () => {
    // Força um recarregamento visual ou lógico se necessário.
    // Com onSnapshot, os dados chegam sozinhos, mas às vezes
    // setar Loading(true) e depois false força o React a re-renderizar os filhos.
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
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