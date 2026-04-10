// src/components/serviceOrders/OSDetailModal.tsx
import { useState } from 'react';
import { type ServiceOrder } from '../../types/serviceOrder.types';
import { OSStatusBadge } from './OSStatusBadge';
import { OSQuickActions } from './OSQuickActions';
import { addOSComment } from '../../services/serviceOrderService';
import { formatOSDateTime, getOSTipoLabel, getOSTipoIcon } from '../../utils/osHelpers';
import { useToast } from '../../hooks/useToast';
import { OSImageGenerator } from './OSImageGenerator';

interface OSDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit?: (order: ServiceOrder) => void;
  onUpdate?: () => void;
}

type TabType = 'info' | 'historico' | 'fotos';

export function OSDetailModal({ isOpen, onClose, order, onEdit, onUpdate }: OSDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);

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

  const handleGenerateAndShare = async () => {
    setShowImageGenerator(true);
    setTimeout(async () => {
      const generator = document.querySelector(`#generate-os-${order.id}`) as HTMLButtonElement;
      if (generator) {
        generator.click();
        setTimeout(() => {
          setShowImageGenerator(false);
        }, 1000);
      }
    }, 100);
  };

  const handleImageReady = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `OS-${order.numero}.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `OS ${order.numero}`,
          text: `Ordem de Serviço ${order.numero} - ${order.titulo}`,
          files: [file]
        });
      } catch (error) {
        window.open(`https://wa.me/?text=${encodeURIComponent(`OS ${order.numero} - ${order.titulo}\n${window.location.origin}/osabertas`)}`, '_blank');
      }
    } else {
      const link = document.createElement('a');
      link.download = `OS-${order.numero}.png`;
      link.href = dataUrl;
      link.click();
      setTimeout(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`OS ${order.numero}\nA imagem foi baixada.`)}`, '_blank');
      }, 500);
    }
  };

  const handleWhatsAppShare = () => {
    const message = `OS ${order.numero} - ${order.titulo}\n\n` +
      `Status: ${order.status}\n` +
      `Local: ${order.local}\n` +
      `Solicitante: ${order.solicitanteNome}\n` +
      `Executor: ${order.executorNome || 'Não atribuído'}\n\n` +
      `Descrição:\n${order.descricao}\n\n` +
      `Gerado pelo HPanel`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Informações' },
    { id: 'historico' as TabType, label: 'Histórico' },
    { id: 'fotos' as TabType, label: 'Fotos' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col animate-slide-up overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-none">
                  OS {order.numero}
                </p>
                <OSStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {getOSTipoIcon(order.tipo)} {getOSTipoLabel(order.tipo)} · {order.local}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {order.titulo}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Criado em {formatOSDateTime(order.dataCriacao)}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-gray-100 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 max-h-[55vh]">

          {activeTab === 'info' && (
            <>
              {/* Descrição */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Descrição</p>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {order.descricao}
                  </p>
                </div>
              </div>

              {/* Solicitante e Executor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Solicitante</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {order.solicitanteNome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{order.solicitanteNome}</p>
                      {order.solicitanteSetor && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{order.solicitanteSetor}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Executor</p>
                  {order.executorNome ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {order.executorNome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{order.executorNome}</p>
                        {order.equipe && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{order.equipe}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Não atribuído</p>
                  )}
                </div>
              </div>

              {/* Datas */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Datas</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Criação</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{formatOSDateTime(order.dataCriacao)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Prazo</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {order.prazo ? formatOSDateTime(order.prazo) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Conclusão</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {order.dataConclusao ? formatOSDateTime(order.dataConclusao) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {order.observacoes && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Observações</p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {order.observacoes}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-4">
              {/* Adicionar comentário */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Adicionar comentário</p>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Descreva a atualização ou comentário..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddComment}
                      disabled={addingComment || !newComment.trim()}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 
                               rounded-xl text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 
                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {addingComment ? 'Enviando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Histórico</p>
                {order.historico && order.historico.length > 0 ? (
                  <div className="space-y-3">
                    {[...order.historico].reverse().map((entry) => (
                      <div key={entry.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                              {entry.usuarioNome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {entry.usuarioNome}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                            {formatOSDateTime(entry.data)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 pl-8">
                          {entry.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum histórico registrado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'fotos' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border border-gray-100 dark:border-gray-800 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Em breve</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Upload de fotos estará disponível na próxima atualização
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-sm font-medium 
                       hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.564 4.144 1.546 5.879L0 24l6.32-1.504A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleGenerateAndShare}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                       rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 
                       transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Gerar imagem
            </button>

            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 
                         rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 
                         transition-all flex items-center gap-2 border border-blue-200 dark:border-blue-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                Editar
              </button>
            )}
          </div>

          <div>
            <OSQuickActions order={order} onActionComplete={onUpdate} />
          </div>
        </div>

        {/* Hidden Image Generator */}
        {showImageGenerator && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <OSImageGenerator order={order} onImageReady={handleImageReady} />
          </div>
        )}
      </div>
    </div>
  );
}