// src/components/guestGuide/PDFViewerModal.tsx

import { useEffect } from 'react';

interface PDFViewerModalProps {
  isOpen: boolean;
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export function PDFViewerModal({ isOpen, pdfUrl, title, onClose }: PDFViewerModalProps) {
  // Fecha com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Botão fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl transition-all hover:scale-110"
        aria-label="Fechar"
      >
        ✕
      </button>

      {/* Título */}
      <div className="absolute top-4 left-4 z-10">
        <p className="text-white/80 text-sm font-medium bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
          {title}
        </p>
      </div>

      {/* Visualizador */}
      <div 
        className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          title={title}
        />
      </div>
    </div>
  );
}