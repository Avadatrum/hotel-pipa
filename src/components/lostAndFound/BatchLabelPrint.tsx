// src/components/lostAndFound/BatchLabelPrint.tsx

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'qrcode';
import type { LostItem } from '../../types/lostAndFound.types';

interface BatchLabelPrintProps {
  items: LostItem[];
  onClose: () => void;
}

interface ItemWithQuantity {
  item: LostItem;
  quantity: number;
}

export const BatchLabelPrint: React.FC<BatchLabelPrintProps> = ({ items, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<ItemWithQuantity[]>(
    items.filter(i => i.status === 'guardado').map(item => ({ item, quantity: 1 }))
  );
  const [qrcodes, setQrcodes] = useState<Map<string, string>>(new Map());
  const [globalQuantity, setGlobalQuantity] = useState(1);

  // Gerar QR Codes para todos os itens selecionados
  React.useEffect(() => {
    const generateQRCodes = async () => {
      const newQRCodes = new Map<string, string>();
      
      for (const { item } of selectedItems) {
        try {
          const url = await QRCode.toDataURL(item.uniqueCode, {
            width: 100,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          newQRCodes.set(item.id, url);
        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }
      
      setQrcodes(newQRCodes);
    };

    if (selectedItems.length > 0) {
      generateQRCodes();
    }
  }, [selectedItems]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, // ✅ CORREÇÃO: Usar contentRef ao invés de content
    documentTitle: `Etiquetas_Achados_Perdidos_${new Date().toLocaleDateString('pt-BR')}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1.5cm;
      }
      @media print {
        body { 
          margin: 0;
          background: white;
        }
        .batch-etiquetas-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .etiqueta-item {
          break-inside: avoid;
          page-break-inside: avoid;
          border: 2px solid #000;
          padding: 10px;
          border-radius: 6px;
          background: white;
        }
        .page-break {
          page-break-after: always;
        }
      }
    `,
  });

  // Atualizar quantidade de um item específico
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.item.id === itemId
          ? { ...item, quantity: Math.max(0, Math.min(20, quantity)) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  // Aplicar quantidade global a todos os itens
  const applyGlobalQuantity = () => {
    setSelectedItems(prev =>
      prev.map(item => ({
        ...item,
        quantity: globalQuantity
      }))
    );
  };

  // Selecionar/Desselecionar todos os itens guardados
  const toggleSelectAll = () => {
    const guardados = items.filter(i => i.status === 'guardado');
    
    if (selectedItems.length === guardados.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(guardados.map(item => ({ item, quantity: globalQuantity })));
    }
  };

  // Total de etiquetas a serem impressas
  const totalEtiquetas = selectedItems.reduce((sum, curr) => sum + curr.quantity, 0);
  
  // Itens guardados disponíveis
  const availableItems = items.filter(i => i.status === 'guardado');

  // Renderizar etiquetas para impressão
  const renderBatchLabels = () => {
    const labels: React.ReactNode[] = []; // ✅ CORREÇÃO: Usar React.ReactNode[] ao invés de JSX.Element[]
    
    selectedItems.forEach(({ item, quantity }) => {
      const qrcode = qrcodes.get(item.id);
      
      for (let i = 0; i < quantity; i++) {
        labels.push(
          <div key={`${item.id}-${i}`} className="etiqueta-item">
            {/* Cabeçalho */}
            <div style={{
              borderBottom: '2px dashed #ccc',
              paddingBottom: '6px',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '13px', 
                fontWeight: 'bold',
                color: '#1e40af'
              }}>
                🏨 HOTEL PIPA
              </h3>
              <span style={{ 
                fontSize: '10px',
                color: '#6b7280'
              }}>
                {i + 1}/{quantity}
              </span>
            </div>

            {/* Conteúdo Principal */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* QR Code */}
              {qrcode && (
                <div style={{ flexShrink: 0 }}>
                  <img 
                    src={qrcode} 
                    alt="QR Code" 
                    style={{ width: '70px', height: '70px' }}
                  />
                </div>
              )}

              {/* Informações */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  fontFamily: 'monospace',
                  color: '#2563eb',
                  marginBottom: '3px'
                }}>
                  {item.uniqueCode}
                </div>
                <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                  <strong>📅</strong> {item.foundDate.toLocaleDateString('pt-BR')}
                </div>
                <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                  <strong>📦</strong> {item.description.length > 25 
                    ? item.description.substring(0, 25) + '...' 
                    : item.description}
                </div>
                <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                  <strong>📍</strong> {item.foundLocation}
                </div>
                {item.color && (
                  <div style={{ fontSize: '11px' }}>
                    <strong>🎨</strong> {item.color}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '9px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Retirar na Recepção • Apresentar este código
            </div>
          </div>
        );
      }
    });
    
    return labels;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              🖨️ Impressão em Lote de Etiquetas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selecione os itens e defina quantas etiquetas de cada
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              📊 {availableItems.length} itens guardados disponíveis
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              🏷️ Total: {totalEtiquetas} etiqueta{totalEtiquetas !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Controles Globais */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={globalQuantity}
                onChange={(e) => setGlobalQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-20 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
              <button
                onClick={applyGlobalQuantity}
                className="px-3 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Aplicar a todos
              </button>
            </div>
            
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
            >
              {selectedItems.length === availableItems.length 
                ? '⬜ Desmarcar todos' 
                : '✅ Selecionar todos'}
            </button>

            <div className="flex-1" />
            
            <span className="text-xs text-slate-500">
              💡 Máx. 20 por item
            </span>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">📦</span>
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum item guardado disponível para impressão
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableItems.map((item) => {
                const selected = selectedItems.find(s => s.item.id === item.id);
                const isSelected = !!selected;
                
                return (
                  <div
                    key={item.id}
                    className={`
                      border-2 rounded-xl p-4 transition-all
                      ${isSelected 
                        ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedItems(prev => prev.filter(s => s.item.id !== item.id));
                          } else {
                            setSelectedItems(prev => [...prev, { item, quantity: globalQuantity }]);
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Info do Item */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.uniqueCode}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {item.foundDate.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {item.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          📍 {item.foundLocation}
                          {item.color && ` • 🎨 ${item.color}`}
                        </p>
                      </div>

                      {/* Controle de Quantidade */}
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQuantity(item.id, selected.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold transition-colors"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={selected.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                          />
                          <button
                            onClick={() => updateItemQuantity(item.id, selected.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selecionado{selectedItems.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              🖨️ Imprimir {totalEtiquetas} Etiqueta{totalEtiquetas !== 1 ? 's' : ''}
            </button>
          </div>
        </div>

        {/* Container oculto para impressão */}
        <div style={{ display: 'none' }}>
          <div ref={componentRef}>
            <div className="batch-etiquetas-container">
              {renderBatchLabels()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};