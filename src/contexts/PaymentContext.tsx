// src/contexts/PaymentContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { CommissionPayment } from '../types';

interface PaymentContextType {
  payments: CommissionPayment[];
  loading: boolean;
  getPaymentsBySale: (saleId: string) => CommissionPayment[];
  getTotalPaidByPeriod: (startDate: Date, endDate: Date) => number;
  refreshPayments: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsub = onSnapshot(
      query(collection(db, 'commissionPayments'), orderBy('paidAt', 'desc')),
      snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CommissionPayment[]);
        setLoading(false);
      },
      err => {
        console.error('payments listener:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const getPaymentsBySale = (saleId: string) => {
    return payments.filter(p => p.saleIds.includes(saleId));
  };

  const getTotalPaidByPeriod = (startDate: Date, endDate: Date) => {
    return payments
      .filter(p => {
        const paidDate = p.paidAt?.toDate();
        return paidDate >= startDate && paidDate <= endDate;
      })
      .reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const refreshPayments = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <PaymentContext.Provider value={{
      payments,
      loading,
      getPaymentsBySale,
      getTotalPaidByPeriod,
      refreshPayments
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayments must be used within PaymentProvider');
  return ctx;
}