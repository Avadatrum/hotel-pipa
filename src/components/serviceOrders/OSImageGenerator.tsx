import { useRef } from 'react';
import { toPng } from 'html-to-image';
import type { ServiceOrder } from '../../types/serviceOrder.types';
import { getOSTipoIcon, getOSTipoLabel, formatOSDate } from '../../utils/osHelpers';

interface OSImageGeneratorProps {
  order: ServiceOrder;
  onImageReady?: (dataUrl: string) => void;
}

export function OSImageGenerator({ order, onImageReady }: OSImageGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      onImageReady?.(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      aberta: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
      em_andamento: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
      concluida: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
      cancelada: { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' }
    };
    return colors[status as keyof typeof colors] || colors.aberta;
  };

  const statusColors = getStatusColor(order.status);
  const statusLabel = order.status === 'aberta' ? '🔴 EM ABERTO' : 
                      order.status === 'em_andamento' ? '🟡 EM ANDAMENTO' :
                      order.status === 'concluida' ? '✅ CONCLUÍDA' : '❌ CANCELADA';

  return (
    <div className="relative">
      {/* Card que será convertido em imagem */}
      <div
        ref={cardRef}
        className="w-[600px] bg-white p-6 rounded-2xl shadow-2xl"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-2 border-gray-200 pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HPanel</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Ordem de Serviço</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-blue-600">{order.numero}</div>
              <div className="text-xs text-gray-500">{formatOSDate(order.dataCriacao)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <span 
              className="px-3 py-1.5 rounded-full text-sm font-bold border"
              style={{ 
                backgroundColor: statusColors.bg, 
                color: statusColors.text,
                borderColor: statusColors.border
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Título e Tipo */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{order.titulo}</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">{getOSTipoIcon(order.tipo)}</span>
            <span className="font-medium">{getOSTipoLabel(order.tipo)}</span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-1">
              <span>📍</span> {order.local}
            </span>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
            {order.descricao}
          </p>
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">SOLICITANTE</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">
                  {order.solicitanteNome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.solicitanteNome}</p>
                {order.solicitanteSetor && (
                  <p className="text-xs text-gray-500">{order.solicitanteSetor}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">EXECUTOR</p>
            {order.executorNome ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">
                    {order.executorNome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{order.executorNome}</p>
                  {order.equipe && (
                    <p className="text-xs text-gray-500">{order.equipe}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Não atribuído</p>
            )}
          </div>
        </div>

        {/* Prazo */}
        {order.prazo && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <span className="text-amber-600 text-lg">📅</span>
            <div>
              <p className="text-xs text-amber-600 font-medium">PRAZO</p>
              <p className="font-semibold text-gray-900">{formatOSDate(order.prazo)}</p>
            </div>
          </div>
        )}

        {/* Observações */}
        {order.observacoes && (
          <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">📝 OBSERVAÇÕES</p>
            <p className="text-gray-700 text-sm">{order.observacoes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌴</span>
              <span className="text-xs text-gray-500">Hotel da Pipa • HPanel</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Botão para gerar (será usado pelo componente pai) */}
      <button
        onClick={generateImage}
        className="hidden"
        id={`generate-os-${order.id}`}
      />
    </div>
  );
}