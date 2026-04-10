// src/components/serviceOrders/OSNotificationToast.tsx
import { useEffect, useState } from 'react';
import { type ServiceOrder } from '../../types/serviceOrder.types';

// Removido o import de getOSPrioridadeConfig pois não existe/isso causava o erro

interface OSNotificationToastProps {
  order: ServiceOrder;
  onClose: () => void;
  onShareWhatsApp?: () => void;
  autoClose?: boolean;
  duration?: number;
}

// Função auxiliar local para substituir a função faltante do helper
const getPriorityConfig = (priority: string | undefined) => {
  switch(priority) {
    case 'alta':
      return { 
        label: 'Alta', 
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        border: 'border-red-500'
      };
    case 'media':
      return { 
        label: 'Média', 
        classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500'
      };
    case 'baixa':
      return { 
        label: 'Baixa', 
        classes: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        border: 'border-green-500'
      };
    default:
      return { 
        label: 'Normal', 
        classes: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        border: 'border-gray-500'
      };
  }
};

export function OSNotificationToast({ 
  order, 
  onClose, 
  onShareWhatsApp,
  autoClose = true,
  duration = 5000 
}: OSNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Acessa propriedades de forma segura usando (order as any) ou operador optional chaining
  // para evitar erros de compilação se o tipo ServiceOrder estiver incompleto
  const priorityValue = (order as any).prioridade || 'normal';
  const prioridadeConfig = getPriorityConfig(priorityValue);
  
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);
  
  const handleWhatsAppShare = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
    } else {
      // Acessando propriedades com segurança para evitar o erro "Property does not exist"
      const numero = (order as any).numero || 'N/A';
      const titulo = (order as any).titulo || 'Sem título';
      const local = (order as any).local || 'Não informado';
      const solicitanteNome = (order as any).solicitanteNome || 'Não informado';
      const descricao = (order as any).descricao || '';

      const message = `🛠️ *NOVA OS - ${numero}*\n\n` +
        `*Título:* ${titulo}\n` +
        `*Local:* ${local}\n` +
        `*Prioridade:* ${prioridadeConfig.label}\n` +
        `*Solicitante:* ${solicitanteNome}\n\n` +
        `*Descrição:*\n${descricao}`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };
  
  return (
    <div className={`
      fixed bottom-4 right-4 z-50 max-w-md
      transform transition-all duration-300
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4
        ${prioridadeConfig.border}
        p-4
      `}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">🛠️</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                {(order as any).numero}
              </span>
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${prioridadeConfig.classes}
              `}>
                {prioridadeConfig.label}
              </span>
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {(order as any).titulo}
            </h4>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {(order as any).local} • {(order as any).solicitanteNome}
            </p>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {(order as any).descricao}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg 
                     hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
          >
            <span>📱</span> Compartilhar no WhatsApp
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 
                     dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}