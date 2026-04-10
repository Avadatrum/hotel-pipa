//src/contexts/OSContext.tsx
import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import { type ServiceOrder } from '../types/serviceOrder.types';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { setOSCurrentUser } from '../services/serviceOrderService';
import { useAuth } from './AuthContext';

interface OSContextType {
  orders: ServiceOrder[];
  loading: boolean;
  refreshOrders: () => void;
  showNotification: boolean;
  setShowNotification: (show: boolean) => void;
  lastCreatedOrder: ServiceOrder | null;
  setLastCreatedOrder: (order: ServiceOrder | null) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export function OSProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { orders, loading, refreshOrders } = useServiceOrders();
  const [showNotification, setShowNotification] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<ServiceOrder | null>(null);
  
  // Sincronizar usuário atual com o serviço de OS
  useEffect(() => {
    if (user) {
      setOSCurrentUser(user.id, user.name);
    }
  }, [user]);
  
  return (
    <OSContext.Provider value={{
      orders,
      loading,
      refreshOrders,
      showNotification,
      setShowNotification,
      lastCreatedOrder,
      setLastCreatedOrder,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within OSProvider');
  }
  return context;
}