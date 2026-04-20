// src/components/lostAndFound/LostItemLabel.tsx

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { LostItem } from '../../types/lostAndFound.types';
import QRCode from 'qrcode'; 

interface LostItemLabelProps {
  item: LostItem;
  onClose?: () => void;
}

export const LostItemLabel: React.FC<LostItemLabelProps> = ({ item, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [qrcodeDataUrl, setQrcodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  // Gerar QR Code
  React.useEffect(() => {
    const generateQR = async () => {
      setIsGenerating(true);
      try {
        const url = await QRCode.toDataURL(item.uniqueCode, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrcodeDataUrl(url);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      } finally {
        setIsGenerating(false);
      }
    };
    generateQR();
  }, [item.uniqueCode]);

  // CORREÇÃO: Usar contentRef ao invés de content
  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Etiqueta_${item.uniqueCode}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body { margin: 0; }
      }
    `,
  });

  return (
    <div className="space-y-4">
      {/* Preview Visual */}
      <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
        {isGenerating ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
            Gerando QR Code...
          </div>
        ) : (
          <div ref={componentRef}>
            <div style={{
              border: '2px solid #000',
              padding: '12px',
              borderRadius: '8px',
              background: 'white',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              {/* Cabeçalho */}
              <div style={{
                borderBottom: '2px dashed #ccc',
                paddingBottom: '8px',
                marginBottom: '8px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#1e40af'
                }}>
                  🏨 HOTEL PIPA - Achados & Perdidos
                </h3>
              </div>

              {/* Conteúdo Principal */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {qrcodeDataUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={qrcodeDataUrl} 
                      alt="QR Code" 
                      style={{ width: '80px', height: '80px' }}
                    />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    fontFamily: 'monospace',
                    color: '#2563eb',
                    marginBottom: '4px'
                  }}>
                    {item.uniqueCode}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                    <strong>📅 Data:</strong> {item.foundDate.toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                    <strong>📦 Item:</strong> {item.description}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                    <strong>📍 Local:</strong> {item.foundLocation}
                  </div>
                  {item.color && (
                    <div style={{ fontSize: '12px' }}>
                      <strong>🎨 Cor:</strong> {item.color}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé */}
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Retirar na Recepção • Apresentar este código
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        )}
        <button
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          🖨️ Imprimir Etiqueta
        </button>
      </div>
    </div>
  );
};