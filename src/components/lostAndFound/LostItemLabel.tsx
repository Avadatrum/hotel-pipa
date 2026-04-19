// src/components/lostAndFound/LostItemLabel.tsx
import React, { useRef } from 'react';
import type { LostItem } from '../../types/lostAndFound.types';
import { useReactToPrint } from 'react-to-print';

interface LostItemLabelProps {
  item: LostItem;
}

const categoryLabel: Record<string, string> = {
  eletrônico:     'Eletrônico',
  documento:      'Documento',
  roupa:          'Roupa',
  acessório:      'Acessório',
  bagagem:        'Bagagem',
  objeto_pessoal: 'Objeto Pessoal',
  outro:          'Outro',
};

const LabelContent = React.forwardRef<HTMLDivElement, { item: LostItem }>(({ item }, ref) => (
  <div ref={ref} style={{ fontFamily: 'monospace', padding: 0, background: '#fff' }}>
    <div style={{
      width: '280px',
      border: '2px solid #1e293b',
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '20px auto',
    }}>
      {/* Cabeçalho */}
      <div style={{
        background: '#1e293b',
        color: '#fff',
        textAlign: 'center',
        padding: '10px 12px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em' }}>🌴 HOTEL PIPA</div>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', opacity: 0.7, marginTop: '2px' }}>ACHADOS & PERDIDOS</div>
      </div>

      {/* Código */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center',
        padding: '10px',
      }}>
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.08em', color: '#1e40af' }}>
          {item.uniqueCode}
        </div>
      </div>

      {/* Campos */}
      <div style={{ padding: '12px', fontSize: '11px', lineHeight: '1.7', color: '#334155' }}>
        <LabelRow label="Categoria" value={categoryLabel[item.category] || item.category} />
        <LabelRow label="Data" value={item.foundDate.toLocaleDateString('pt-BR')} />
        <LabelRow label="Local" value={item.foundLocation} />
        {item.color && <LabelRow label="Cor" value={item.color} />}
        <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
          <span style={{ fontWeight: 700 }}>Descrição: </span>{item.description}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{
        background: '#f1f5f9',
        borderTop: '1px solid #e2e8f0',
        padding: '8px 12px',
        fontSize: '10px',
        color: '#64748b',
        textAlign: 'center',
      }}>
        Entregue por: {item.deliveredBy}
      </div>
    </div>
  </div>
));

LabelContent.displayName = 'LabelContent';

const LabelRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span style={{ fontWeight: 700 }}>{label}: </span>
    <span>{value}</span>
  </div>
);

export const LostItemLabel: React.FC<LostItemLabelProps> = ({ item }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  // CORREÇÃO: Usar contentRef em vez de content
  const handlePrint = useReactToPrint({
    contentRef: componentRef,  // ← Alterado de 'content' para 'contentRef'
  });

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden scale-90 origin-top">
        <LabelContent ref={componentRef} item={item} />
      </div>

      <button
        onClick={handlePrint}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
      >
        🖨️ Imprimir Etiqueta
      </button>
    </div>
  );
};