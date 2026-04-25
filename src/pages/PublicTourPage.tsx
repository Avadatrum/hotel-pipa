// src/pages/PublicTourPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatCurrency } from '../utils/commissionCalculations';
import type { Tour } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsappUrl(tourName: string) {
  const text = encodeURIComponent(
    `Olá! Tenho interesse no passeio *${tourName}* e gostaria de reservar uma data. 🌊`,
  );
  return `https://wa.me/5584999999999?text=${text}`;
}

// ─── Telas de Estado (Loading/Erro) ───────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf8f2]">
      <div className="w-full max-w-md px-6 space-y-6">
        <div className="h-72 w-full rounded-3xl bg-[#e8ddd0] animate-pulse" />
        <div className="h-10 w-3/4 rounded-xl bg-[#e8ddd0] animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-[#e8ddd0] animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-[#e8ddd0] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf8f2] p-8 text-center">
      <div className="max-w-sm">
        <span className="text-6xl mb-6 block">🏝️</span>
        <h1 className="text-3xl font-serif font-bold mb-4 text-[#4a3728]">Passeio não encontrado</h1>
        <Link to="/passeios" className="text-[#1a3a4a] font-bold underline italic">Voltar para a lista</Link>
      </div>
    </div>
  );
}

// ─── Componentes Auxiliares ───────────────────────────────────────────────────

function LegalDisclaimer() {
  return (
    <section className="mt-12 px-2 opacity-90 animate-up" style={{ animationDelay: '0.5s' }}>
      <div className="bg-[#f0e6d9]/40 border border-[#e0d4c4] rounded-2xl p-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9c7d62] mb-3 flex items-center gap-2">
          <span className="text-sm">⚖️</span> Aviso de Intermediação
        </h3>
        <p className="text-[13px] text-[#7a6050] leading-relaxed font-body italic">
          O <strong>Hotel da Pipa</strong> atua exclusivamente como canal de divulgação e indicação de experiências locais. 
          Não somos os organizadores dos passeios e não nos responsabilizamos pela prestação, segurança ou cancelamento 
          dos serviços contratados diretamente com os operadores parceiros.
        </p>
      </div>
    </section>
  );
}

interface PhotoModalProps {
  src: string; alt: string; total: number; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}

function PhotoModal({ src, alt, total, index, onClose, onPrev, onNext }: PhotoModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md" onClick={onClose}>
      <button className="absolute top-6 right-6 text-white text-4xl z-10 p-4">×</button>
      <div className="absolute top-8 text-white/70 font-mono text-sm">{index + 1} / {total}</div>
      <img 
        src={src} alt={alt} 
        className="max-w-[95%] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform"
        onClick={(e) => e.stopPropagation()} 
      />
      {total > 1 && (
        <>
          <button onClick={(e) => {e.stopPropagation(); onPrev();}} className="absolute left-4 p-4 text-white text-5xl">‹</button>
          <button onClick={(e) => {e.stopPropagation(); onNext();}} className="absolute right-4 p-4 text-white text-5xl">›</button>
        </>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export function PublicTourPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!tourId) return;
    getDoc(doc(db, 'tours', tourId))
      .then((snap) => {
        if (snap.exists()) setTour({ id: snap.id, ...snap.data() } as Tour);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tourId]);

  const openPhoto = useCallback((i: number) => setPhotoIndex(i), []);
  const closePhoto = useCallback(() => setPhotoIndex(null), []);
  
  if (loading) return <LoadingScreen />;
  if (!tour) return <NotFoundScreen />;

  const fotos = tour.fotos ?? [];
  const whatsappUrl = buildWhatsappUrl(tour.nome);

  return (
    <div className="min-h-screen bg-[#fdf8f2] text-[#4a3728] pb-40">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Lora', serif; }
        
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-up { animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .tour-description h1, .tour-description h2 { font-family: 'Playfair Display', serif; color: #4a3728; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 700; }
        .tour-description p { margin-bottom: 1rem; }
        .tour-description ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
      `}</style>

      {/* Botão de Voltar */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/passeios" className="bg-white/90 backdrop-blur shadow-sm px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-[#1a3a4a] flex items-center gap-2 hover:bg-white transition-colors">
          ← Explorar
        </Link>
      </div>

      {/* HERO SECTION */}
      <header className="relative h-[65vh] min-h-[400px] overflow-hidden">
        {fotos[0] ? (
          <img src={fotos[0]} alt={tour.nome} className="w-full h-full object-cover scale-105" />
        ) : (
          <div className="w-full h-full bg-[#e8ddd0]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fdf8f2] via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 max-w-2xl mx-auto">
          <div className="animate-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-amber-400 text-[#4a3728] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 inline-block">
              Experiência Local
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-white leading-tight drop-shadow-md">
              {tour.nome}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 -mt-8 relative z-10">
        {/* Card de Preço */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-up" style={{ animationDelay: '0.2s' }}>
          <div>
            <p className="text-[#b09880] text-xs font-bold uppercase tracking-widest mb-1">A partir de</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-black text-[#1a3a4a]">{formatCurrency(tour.precoBase)}</span>
              <span className="text-sm text-[#b09880] italic">{tour.tipoPreco === 'por_pessoa' ? '/ pessoa' : '/ saída'}</span>
            </div>
          </div>
          <div className="text-center sm:text-right">
             <div className="text-xs text-slate-400 mb-1">Disponibilidade</div>
             <div className="font-bold text-[#4a3728]">Sob consulta 🗓️</div>
          </div>
        </div>

        {/* Descrição Detalhada */}
        <section className="mt-12 animate-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-4">
            Sobre o passeio <span className="h-px bg-[#e0d4c4] flex-1" />
          </h2>
          <div 
            className="font-body text-[#7a6050] text-lg leading-relaxed tour-description"
            dangerouslySetInnerHTML={{ __html: tour.descricao || '' }}
          />
        </section>

        {/* Galeria Grid */}
        {fotos.length > 1 && (
          <section className="mt-16 animate-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-serif font-bold mb-6 italic">Registros</h2>
            <div className="grid grid-cols-2 gap-3">
              {fotos.slice(1, 5).map((f, i) => (
                <div 
                  key={i} 
                  onClick={() => openPhoto(i + 1)}
                  className={`relative overflow-hidden rounded-2xl cursor-zoom-in ${i === 0 ? 'row-span-2 h-full' : 'h-40'}`}
                >
                  <img src={f} alt="Galeria" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AVISO LEGAL */}
        <LegalDisclaimer />
      </main>

      {/* CTA FIXO MOBILE/DESKTOP */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-[#fdf8f2] via-[#fdf8f2]/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black shadow-2xl shadow-green-200 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            RESERVAR PELO WHATSAPP
          </a>
        </div>
      </div>

      {/* Modal de Foto */}
      {photoIndex !== null && (
        <PhotoModal
          src={fotos[photoIndex]}
          alt={tour.nome}
          index={photoIndex}
          total={fotos.length}
          onClose={closePhoto}
          onPrev={() => setPhotoIndex((photoIndex - 1 + fotos.length) % fotos.length)}
          onNext={() => setPhotoIndex((photoIndex + 1) % fotos.length)}
        />
      )}
    </div>
  );
}