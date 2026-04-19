// src/components/lostAndFound/ItemImage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface ItemImageProps {
  photoURL?: string;
  alt: string;
  className?: string;
}

export const ItemImage: React.FC<ItemImageProps> = ({ photoURL, alt, className = "w-24 h-24 object-cover rounded-lg" }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentURL, setCurrentURL] = useState<string | undefined>(photoURL);
  const imgRef = useRef<HTMLImageElement>(null);

  // Forçar atualização quando photoURL mudar
  useEffect(() => {
    console.log('🔄 URL da imagem mudou:', photoURL);
    setCurrentURL(photoURL);
    setError(false);
    setLoading(true);
    
    // Forçar recarga da imagem
    if (imgRef.current && photoURL) {
      imgRef.current.src = photoURL;
    }
  }, [photoURL]);

  if (!currentURL || error) {
    return (
      <div className={`${className} bg-slate-200 flex items-center justify-center`}>
        <span className="text-2xl text-slate-400">📷</span>
      </div>
    );
  }

  // Adicionar timestamp para evitar cache do navegador
  const urlWithTimestamp = currentURL.includes('?') 
    ? `${currentURL}&t=${Date.now()}` 
    : `${currentURL}?t=${Date.now()}`;

  return (
    <div className="relative">
      {loading && (
        <div className={`${className} absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center`}>
          <span className="text-sm text-slate-400">Carregando...</span>
        </div>
      )}
      <img 
        ref={imgRef}
        src={urlWithTimestamp}
        alt={alt}
        className={className}
        onLoad={() => {
          console.log('✅ Imagem carregada com sucesso:', currentURL);
          setLoading(false);
        }}
        // ✅ CORRIGIDO: Parâmetro 'e' removido
        onError={() => {
          console.error('❌ Erro ao carregar imagem:', currentURL);
          setError(true);
          setLoading(false);
        }}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};