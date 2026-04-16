import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ServiceOrder } from '../../types/serviceOrder.types';
import { getOSTipoIcon, getOSTipoLabel, formatOSDate } from '../../utils/osHelpers';

interface OSImageGeneratorProps {
  order: ServiceOrder;
  onImageReady?: (dataUrl: string) => void;
  onPDFReady?: (dataUrl: string) => void;
}

type ExportFormat = 'image' | 'pdf';

export function OSImageGenerator({ order, onImageReady, onPDFReady }: OSImageGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const statusLabel = {
    aberta: 'EM ABERTO',
    em_andamento: 'EM ANDAMENTO',
    concluida: 'CONCLUÍDA',
    cancelada: 'CANCELADA'
  }[order.status] || 'STATUS';

  const isConcluida = order.status === 'concluida';
  const isAberta = order.status === 'aberta';
  const isCancelada = order.status === 'cancelada';

  const getStatusColor = () => {
    if (isAberta) return { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600' };
    if (isConcluida) return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-600' };
    if (isCancelada) return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-600' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-600' };
  };

  const statusColors = getStatusColor();

  // Gerar Imagem (PNG)
  const generateImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: isAberta ? '#EFF6FF' : isConcluida ? '#ECFDF5' : '#FFFFFF',
      });
      onImageReady?.(dataUrl);
      const link = document.createElement('a');
      link.download = `OS-${order.numero}.png`;
      link.href = dataUrl;
      link.click();
      return dataUrl;
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Gerar PDF (meia folha A4)
  const generatePDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight;
      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      onPDFReady?.(pdfUrl);
      const link = document.createElement('a');
      link.download = `OS-${order.numero}.pdf`;
      link.href = pdfUrl;
      link.click();
      return pdfUrl;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    setShowFormatSelector(false);
    if (format === 'image') {
      generateImage();
    } else {
      generatePDF();
    }
  };

  // Componente do Card (versão para imagem) — inalterado
  const renderCard = () => (
    <div
      ref={cardRef}
      className={`w-[600px] p-8 rounded-3xl border-2 ${statusColors.bg} ${statusColors.border}`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ORDEM DE SERVIÇO</h1>
          <p className="text-gray-500 font-mono text-lg mt-1">{order.numero}</p>
        </div>
        <div className="text-right">
          <span className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide text-white ${statusColors.badge}`}>
            {statusLabel}
          </span>
          <p className="text-sm text-gray-400 mt-2 font-mono">{formatOSDate(order.dataCriacao)}</p>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{order.titulo}</h2>
        <div className="flex items-center gap-4 text-gray-600 font-medium">
          <span className="flex items-center gap-1">
            <span className="text-xl">{getOSTipoIcon(order.tipo)}</span>
            {getOSTipoLabel(order.tipo)}
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">📍 {order.local}</span>
        </div>
      </div>
      <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-200">
        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
          {order.descricao}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SOLICITADO POR</p>
          <p className="text-lg font-semibold text-gray-900"></p>
          {order.solicitanteSetor && (
            <p className="text-sm text-gray-500">{order.solicitanteSetor}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">EXECUTADO POR</p>
          <p className="text-lg font-semibold text-gray-900">{order.executorNome || '—'}</p>
          {order.equipe && (
            <p className="text-sm text-gray-500">{order.equipe}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">LOCAL</p>
          <p className="text-sm font-medium text-gray-700">{order.local}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">DATA</p>
          <p className="text-sm font-medium text-gray-700">{formatOSDate(order.dataCriacao)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">PRAZO</p>
          <p className="text-sm font-medium text-gray-700">{order.prazo ? formatOSDate(order.prazo) : '—'}</p>
        </div>
      </div>
      {order.observacoes && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">📝 OBSERVAÇÕES</p>
          <p className="text-gray-700 text-sm">{order.observacoes}</p>
        </div>
      )}
      <div className="border-t border-gray-200 pt-5 flex justify-between items-center text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌴</span>
          <span>Hotel da Pipa • HPanel</span>
        </div>
        <span className="font-mono">{new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );

  // ─── VERSÃO PDF: meia folha A4, mínimo de tinta ───────────────────────────
  const renderPrintVersion = () => (
    <div
      ref={printRef}
      className="bg-white"
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        width: '290px',
        padding: '12px 16px', // Padding ajustado para compactar
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid #111', paddingBottom: '4px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {/* Título diminuído */}
            <p style={{ fontSize: '5px', fontWeight: 700, letterSpacing: '0.05em', margin: 0, color: '#111' }}>
              ORDEM DE SERVIÇO
            </p>
            <p style={{ fontSize: '7px', fontFamily: 'monospace', color: '#555', margin: '1px 0 0' }}>
              {order.numero}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.07em', color: '#111', margin: 0 }}>
              [{statusLabel}]
            </p>
            <p style={{ fontSize: '7px', fontFamily: 'monospace', color: '#555', margin: '1px 0 0' }}>
              {formatOSDate(order.dataCriacao)}
            </p>
          </div>
        </div>
      </div>

      {/* Título + Local */}
<div style={{ marginBottom: '5px' }}>
  <p style={{ fontSize: '6.3px', fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
    {order.titulo}
  </p>
  <p style={{ fontSize: '4.9px', color: '#444', margin: 0 }}>
    📍 {order.local}
  </p>
</div>

{/* Descrição */}
<div style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '4px 6px', marginBottom: '5px' }}>
  <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#666', margin: '0 0 2px', textTransform: 'uppercase' }}>
    Descrição
  </p>
  <p style={{ fontSize: '4.9px', color: '#222', margin: 0, lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
    {order.descricao}
  </p>
</div>

{/* Setor Solicitante / Executor */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px' }}>
  <div>
    <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 1px' }}>
      Solicitado por
    </p>
    {order.solicitanteSetor && (
      <p style={{ fontSize: '4.2px', color: '#555', margin: '1px 0 0' }}>{order.solicitanteSetor}</p>
    )}
  </div>
  <div>
    <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 1px' }}>
      Executado por
    </p>
    <p style={{ fontSize: '4.9px', fontWeight: 600, color: '#111', margin: 0 }}>
      {order.executorNome || '—'}
    </p>
    {order.equipe && (
      <p style={{ fontSize: '4.2px', color: '#555', margin: '1px 0 0' }}>{order.equipe}</p>
    )}
  </div>
</div>

{/* Local + Data */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
  <div>
    <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 1px' }}>Local</p>
    <p style={{ fontSize: '4.9px', color: '#222', margin: 0 }}>{order.local}</p>
  </div>
  <div>
    <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 1px' }}>Abertura</p>
    <p style={{ fontSize: '4.9px', color: '#222', margin: 0 }}>{formatOSDate(order.dataCriacao)}</p>
  </div>
</div>

{/* Observações */}
{order.observacoes && (
  <div style={{ border: '1px dashed #bbb', borderRadius: '3px', padding: '4px 6px', marginBottom: '5px' }}>
    <p style={{ fontSize: '4.2px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 2px' }}>
      Observações
    </p>
    <p style={{ fontSize: '4.9px', color: '#333', margin: 0, lineHeight: 1.2 }}>{order.observacoes}</p>
  </div>
)}

      {/* Assinatura */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '6px', marginTop: '2px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '3px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Executor Responsável
          </p>
          <div style={{ borderBottom: '1px solid #555', marginBottom: '2px' }} />
          <p style={{ fontSize: '6px', color: '#aaa', textAlign: 'center', margin: 0 }}>Assinatura</p>
        </div>
        <div>
          <p style={{ fontSize: '3px', fontWeight: 700, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Data de Conclusão
          </p>
          <div style={{ borderBottom: '1px solid #555', marginBottom: '2px' }} />
          <p style={{ fontSize: '6px', color: '#aaa', textAlign: 'center', margin: 0 }}>___ / ___ / ______</p>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px solid #eee' }}>
        <p style={{ fontSize: '6px', color: '#bbb', margin: 0 }}>Hotel da Pipa</p>
      </div>
    </div>
  );
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {showFormatSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Exportar OS</h3>
            <p className="text-gray-600 mb-6">Escolha o formato para exportar:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('image')}
                disabled={isGenerating}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <span className="text-2xl">🖼️</span>
                Imagem (PNG) - Para WhatsApp
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isGenerating}
                className="w-full p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <span className="text-2xl">📄</span>
                PDF - Para Impressão (com assinatura)
              </button>
            </div>
            <button
              onClick={() => setShowFormatSelector(false)}
              className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {renderCard()}
        {renderPrintVersion()}
      </div>

      <button
        onClick={() => setShowFormatSelector(true)}
        className="hidden"
        id={`generate-os-${order.id}`}
      />

      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6">
            <div className="animate-spin text-4xl mb-2">⚙️</div>
            <p className="text-gray-700">Gerando arquivo...</p>
          </div>
        </div>
      )}
    </>
  );
}