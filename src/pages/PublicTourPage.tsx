// src/pages/PublicTourPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatCurrency } from '../utils/commissionCalculations';
import type { Tour } from '../types';

export function PublicTourPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!tourId) return;
    
    getDoc(doc(db, 'tours', tourId))
      .then(snap => {
        if (snap.exists()) {
          setTour({ id: snap.id, ...snap.data() } as Tour);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tourId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <div className="w-8 h-8 border-2 border-[#8b7355] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] p-4 text-center">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-[#5c4a3d] mb-4">Passeio não encontrado</h1>
          <p className="text-[#8b7355]">Este passeio pode ter sido removido ou o link está incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] text-[#5c4a3d]">
      {/* Header Estilizado */}
      <header className="bg-[#eaddcf] py-16 border-b border-[#dcd0c4]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-serif font-bold mb-4 tracking-tight">{tour.nome}</h1>
          <div className="inline-block bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-[#dcd0c4]">
            <p className="text-[#5c4a3d] text-lg">
              {tour.tipoPreco === 'por_pessoa' ? 'Preço por pessoa' : 'Preço por saída'}: {' '}
              <span className="font-bold text-2xl">{formatCurrency(tour.precoBase)}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          
          {/* Descrição */}
          {tour.descricao && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#8b7355]"></span> Sobre o passeio
              </h2>
              <p className="text-lg text-[#7a6a5a] leading-relaxed whitespace-pre-wrap">
                {tour.descricao}
              </p>
            </div>
          )}

          {/* Galeria de Fotos */}
          {tour.fotos && tour.fotos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-semibold mb-6">Galeria</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tour.fotos.map((foto, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhoto(foto)}
                    className="aspect-square rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-md"
                  >
                    <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA de Contato */}
          <div className="bg-[#f2ece6] rounded-3xl p-8 border border-[#dcd0c4] text-center shadow-sm">
            <h3 className="text-2xl font-serif font-semibold mb-3">Gostou deste passeio?</h3>
            <p className="text-[#8b7355] mb-6">Entre em contato para reservar sua data.</p>
            <a
              href={`https://wa.me/5584999999999?text=${encodeURIComponent(`Olá! Tenho interesse no passeio *${tour.nome}*`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#8b7355] text-white px-8 py-4 rounded-full font-medium hover:bg-[#6f5b44] transition-all shadow-lg hover:shadow-xl"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Modal de Foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fdfaf6]/95 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-8 right-8 text-[#5c4a3d] text-4xl" onClick={() => setSelectedPhoto(null)}>×</button>
          <img src={selectedPhoto} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}