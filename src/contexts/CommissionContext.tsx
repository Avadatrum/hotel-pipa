// src/contexts/CommissionContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Sale, Tour, Agency, CustomCommission } from '../types';

interface CommissionContextType {
  sales: Sale[];
  tours: Tour[];          // Todos os tours (ativos E inativos) — filtrar no componente
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

    // Vendas
    const unsubSales = onSnapshot(
      query(collection(db, 'sales'), orderBy('dataVenda', 'desc')),
      snap => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[]),
      err => console.error('sales listener:', err)
    );

    // Tours: TODOS (sem filtro de ativo) — filtrar nos componentes conforme necessário
    const unsubTours = onSnapshot(
      query(collection(db, 'tours'), orderBy('nome')),
      snap => setTours(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Tour[]),
      err => console.error('tours listener:', err)
    );

    // Agências (só admin)
    let unsubAgencies: () => void = () => {};
    if (user.role === 'admin') {
      unsubAgencies = onSnapshot(
        query(collection(db, 'agencies'), orderBy('nome')),
        snap => setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Agency[]),
        err => console.error('agencies listener:', err)
      );
    }

    // Comissões personalizadas
    const unsubComm = onSnapshot(
      query(collection(db, 'customCommissions'), orderBy('dataInicio', 'desc')),
      snap => setCustomCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CustomCommission[]),
      err => console.error('commissions listener:', err)
    );

    const timer = setTimeout(() => setLoading(false), 800);

    return () => {
      clearTimeout(timer);
      unsubSales(); unsubTours(); unsubAgencies(); unsubComm();
    };
  }, [user]);

  const totalCommissions = sales
    .filter(s => s.status === 'confirmada')
    .reduce((sum, s) => sum + s.comissaoCalculada, 0);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <CommissionContext.Provider value={{ sales, tours, agencies, customCommissions, loading, totalCommissions, refreshData }}>
      {children}
    </CommissionContext.Provider>
  );
}

export function useCommissions() {
  const ctx = useContext(CommissionContext);
  if (!ctx) throw new Error('useCommissions must be used within CommissionProvider');
  return ctx;
}