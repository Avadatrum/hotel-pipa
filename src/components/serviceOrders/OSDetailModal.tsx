// src/components/serviceOrders/OSDetailModal.tsx
import { useState } from 'react';
import { type ServiceOrder } from '../../types/serviceOrder.types';
import { OSStatusBadge } from './OSStatusBadge';
// OSPriorityBadge removido
import { OSQuickActions } from './OSQuickActions';
import { addOSComment } from '../../services/serviceOrderService';
import { formatOSDateTime, getOSTipoLabel, getOSTipoIcon } from '../../utils/osHelpers';
import { useToast } from '../../hooks/useToast';

interface OSDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit?: (order: ServiceOrder) => void;
  onUpdate?: () => void;
}

export function OSDetailModal({ isOpen, onClose, order, onEdit, onUpdate }: OSDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'historico' | 'fotos'>('info');
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  if (!isOpen || !order) return null;
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setAddingComment(true);
    try {
      await addOSComment(order.id, 'Comentário', newComment);
      showToast('Comentário adicionado!', 'success');
      setNewComment('');
      onUpdate?.();
    } catch (error) {
      showToast('Erro ao adicionar comentário', 'error');
    } finally {
      setAddingComment(false);
    }
  };
  
  const handleWhatsAppShare = () => {
    const message = `🛠️ *OS ${order.numero} - ${order.titulo}*\n\n` +
      `*Status:* ${order.status}\n` +
      // Removida linha de prioridade do WhatsApp
      `*Local:* ${order.local}\n` + // Alterado para order.local
      `*Solicitante:* ${order.solicitanteNome}\n` +
      `*Executor:* ${order.executorNome || 'Não atribuído'}\n\n` +
      `*Descrição:*\n${order.descricao}\n\n` +
      `_Gerado pelo HPanel_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                {order.numero}
              </span>
              <OSStatusBadge status={order.status} />
              {/* OSPriorityBadge removido */}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            {order.titulo}
          </h2>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              {getOSTipoIcon(order.tipo)} {getOSTipoLabel(order.tipo)}
            </span>
            {/* Alterado para order.local */}
            <span>📍 {order.local}</span>
            <span>📅 {formatOSDateTime(order.dataCriacao)}</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {[
              { id: 'info', label: 'Informações', icon: '📋' },
              { id: 'historico', label: 'Histórico', icon: '📝' },
              { id: 'fotos', label: 'Fotos', icon: '📸' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Descrição */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Descrição
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {order.descricao}
                </p>
              </div>
              
              {/* Grid de informações */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Solicitante
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                        {order.solicitanteNome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.solicitanteNome}
                      </p>
                      {order.solicitanteSetor && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.solicitanteSetor}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Executor
                  </h3>
                  {order.executorNome ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-lg font-medium text-green-600 dark:text-green-400">
                          {order.executorNome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.executorNome}
                        </p>
                        {order.equipe && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.equipe}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Não atribuído</p>
                  )}
                </div>
              </div>
              
              {/* Datas e prazos */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Data de Criação
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formatOSDateTime(order.dataCriacao)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Prazo
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {order.prazo ? formatOSDateTime(order.prazo) : 'Não definido'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Conclusão
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {order.dataConclusao ? formatOSDateTime(order.dataConclusao) : '—'}
                  </p>
                </div>
              </div>
              
              {/* Observações */}
              {order.observacoes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Observações
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {order.observacoes}
                  </p>
                </div>
              )}
              
              {/* Seção de Custo REMOVIDA */}
            </div>
          )}
          
          {activeTab === 'historico' && (
            <div className="space-y-4">
              {/* Adicionar comentário */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário ou atualização..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingComment ? 'Enviando...' : 'Adicionar Comentário'}
                  </button>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="space-y-3">
                {order.historico && order.historico.length > 0 ? (
                  [...order.historico].reverse().map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {entry.usuarioNome}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatOSDateTime(entry.data)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {entry.descricao}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum histórico registrado
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'fotos' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Em breve
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload de fotos estará disponível na próxima atualização
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                       transition-colors flex items-center gap-2"
            >
              <span>📱</span> Compartilhar
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         transition-colors flex items-center gap-2"
              >
                <span>✏️</span> Editar
              </button>
            )}
          </div>
          
          <div>
            <OSQuickActions order={order} onActionComplete={onUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}