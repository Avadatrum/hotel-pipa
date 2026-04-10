import { useState } from 'react';
import { type ServiceOrder, type OSStatus } from '../../types/serviceOrder.types';
import { updateServiceOrder, addOSComment, deleteServiceOrder } from '../../services/serviceOrderService';
import { useToast } from '../../hooks/useToast';

interface OSQuickActionsProps {
  order: ServiceOrder;
  onActionComplete?: () => void;
  size?: 'sm' | 'md';
  showDelete?: boolean; // 🆕 Nova prop
}

export function OSQuickActions({ 
  order, 
  onActionComplete, 
  size = 'md',
  showDelete = true // 🆕 Padrão true
}: OSQuickActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [deleteComment, setDeleteComment] = useState('');
  const { showToast } = useToast();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };
  
  const handleStatusChange = async (newStatus: OSStatus, comment?: string) => {
    setLoading(true);
    try {
      await updateServiceOrder(order.id, { status: newStatus });
      
      const statusMessages = {
        em_andamento: 'OS iniciada',
        concluida: 'OS concluída',
        cancelada: 'OS cancelada',
        aberta: 'OS reaberta'
      };
      
      if (comment) {
        await addOSComment(order.id, 'Atualização', comment);
      } else {
        await addOSComment(order.id, 'Mudança de Status', statusMessages[newStatus]);
      }
      
      showToast(`Status atualizado com sucesso!`, 'success');
      onActionComplete?.();
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };
  
  // 🆕 Função para excluir OS
  const handleDelete = async () => {
    if (!deleteComment.trim()) {
      showToast('Por favor, justifique a exclusão', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await deleteServiceOrder(order.id);
      showToast(`OS ${order.numero} excluída com sucesso!`, 'success');
      onActionComplete?.();
    } catch (error) {
      showToast('Erro ao excluir OS', 'error');
    } finally {
      setLoading(false);
      setShowConfirm(null);
      setDeleteComment('');
    }
  };
  
  const handleWhatsAppShare = () => {
    // Atualizado: Removido prioridade, substituído localNome por local
    const message = `🛠️ *OS ${order.numero}*\n\n` +
      `*Título:* ${order.titulo}\n` +
      `*Local:* ${order.local}\n` +
      `*Status:* ${order.status}\n\n` +
      `*Descrição:*\n${order.descricao}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  if (order.status === 'concluida') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm('reopen')}
          className={`${sizeClasses[size]} bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors`}
          disabled={loading}
        >
          🔄 Reabrir
        </button>
        <button
          onClick={handleWhatsAppShare}
          className={`${sizeClasses[size]} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
        >
          📱 WhatsApp
        </button>
        {showDelete && (
          <button
            onClick={() => setShowConfirm('delete')}
            className={`${sizeClasses[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
            disabled={loading}
          >
            🗑️
          </button>
        )}
      </div>
    );
  }
  
  if (order.status === 'cancelada') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm('reopen')}
          className={`${sizeClasses[size]} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
          disabled={loading}
        >
          🔄 Reabrir OS
        </button>
        {showDelete && (
          <button
            onClick={() => setShowConfirm('delete')}
            className={`${sizeClasses[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
            disabled={loading}
          >
            🗑️
          </button>
        )}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex gap-2">
        {order.status === 'aberta' && (
          <button
            onClick={() => handleStatusChange('em_andamento')}
            className={`${sizeClasses[size]} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            disabled={loading}
          >
            ▶️ Iniciar
          </button>
        )}
        
        {order.status === 'em_andamento' && (
          <button
            onClick={() => setShowConfirm('complete')}
            className={`${sizeClasses[size]} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
            disabled={loading}
          >
            ✅ Concluir
          </button>
        )}
        
        <button
          onClick={() => setShowConfirm('cancel')}
          className={`${sizeClasses[size]} bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors`}
          disabled={loading}
        >
          ❌ Cancelar
        </button>
        
        <button
          onClick={handleWhatsAppShare}
          className={`${sizeClasses[size]} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
          disabled={loading}
        >
          📱
        </button>
        
        {showDelete && (
          <button
            onClick={() => setShowConfirm('delete')}
            className={`${sizeClasses[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
            disabled={loading}
          >
            🗑️
          </button>
        )}
      </div>
      
      {/* Modal de confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {showConfirm === 'complete' && '✅ Concluir OS'}
              {showConfirm === 'cancel' && '❌ Cancelar OS'}
              {showConfirm === 'reopen' && '🔄 Reabrir OS'}
              {showConfirm === 'delete' && '🗑️ EXCLUIR OS'}
            </h3>
            
            {showConfirm === 'delete' ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Tem certeza que deseja excluir permanentemente a OS <strong>{order.numero}</strong>?
                  Esta ação não pode ser desfeita!
                </p>
                <textarea
                  value={deleteComment}
                  onChange={(e) => setDeleteComment(e.target.value)}
                  placeholder="Justifique o motivo da exclusão *"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </>
            ) : (
              <textarea
                id="action-comment"
                placeholder="Adicione uma observação (opcional)..."
                className="w-full px-3 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            )}
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setDeleteComment('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showConfirm === 'delete') {
                    handleDelete();
                  } else {
                    const comment = (document.getElementById('action-comment') as HTMLTextAreaElement)?.value;
                    const newStatus = showConfirm === 'complete' ? 'concluida' : 
                                     showConfirm === 'cancel' ? 'cancelada' : 'aberta';
                    handleStatusChange(newStatus, comment);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  showConfirm === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={loading}
              >
                {loading ? 'Processando...' : showConfirm === 'delete' ? 'Excluir Permanentemente' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}