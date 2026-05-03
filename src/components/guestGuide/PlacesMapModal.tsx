// src/components/guestGuide/PlacesMapModal.tsx

import { useEffect, useRef, useState } from 'react';
import type { GuidePlace, GuideLanguage } from '../../types/guestGuide.types';

interface PlacesMapModalProps {
  isOpen: boolean;
  places: GuidePlace[];
  language: GuideLanguage;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  beach: '🏖️',
  restaurant: '🍽️',
  bar: '🍸',
  shop: '🛍️',
  attraction: '🎯',
  other: '📍'
};

const SECTION_TITLES: Record<GuideLanguage, { title: string; places: string; close: string; copied: string; coords: string }> = {
  pt: { title: 'Mapa & Locais', places: 'Recomendados para você', close: 'Fechar', copied: 'Copiado!', coords: 'Copiar Coordenadas' },
  es: { title: 'Mapa y Lugares', places: 'Recomendados para ti', close: 'Cerrar', copied: '¡Copiado!', coords: 'Copiar Coordenadas' },
  en: { title: 'Map & Places', places: 'Recommended for you', close: 'Close', copied: 'Copied!', coords: 'Copy Coordinates' }
};

// Componente interno para o Toast de feedback (substituto do Alert)
const Toast = ({ message, show }: { message: string; show: boolean }) => {
  if (!show) return null;
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[110] bg-stone-800 text-white px-4 py-2 rounded-full shadow-xl text-sm font-medium animate-fade-in-up flex items-center gap-2">
      <span>✅</span> {message}
    </div>
  );
};

export function PlacesMapModal({ isOpen, places, language, onClose }: PlacesMapModalProps) {
  const [selectedPlace, setSelectedPlace] = useState<GuidePlace | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const texts = SECTION_TITLES[language];

  // Efeito para Scroll suave ao abrir ou mudar seleção
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultLat = -6.2295;
  const defaultLng = -35.0486;
  const centerLat = places.length > 0 ? places[0].lat : defaultLat;
  const centerLng = places.length > 0 ? places[0].lng : defaultLng;
  const mapSrc = `https://www.google.com/maps?q=${centerLat},${centerLng}&z=15&output=embed`;

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setToastMsg(texts.copied);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-fade-in">
      <Toast message={toastMsg} show={showToast} />

      {/* Header Moderno */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white/95 backdrop-blur-sm shadow-sm z-10 safe-area-top">
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          aria-label={texts.close}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h2 className="font-bold text-stone-800 text-lg tracking-tight">{texts.title}</h2>
        <div className="w-10" /> {/* Espaçador para equilíbrio visual */}
      </div>

      {/* Mapa com borda suave */}
      <div className="h-[40vh] bg-stone-100 flex-shrink-0 relative shadow-inner">
        <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-500"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
        {/* Indicador visual de sobreposição */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Lista de Lugares */}
      <div className="flex-1 overflow-y-auto bg-stone-50 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]" ref={scrollRef}>
        <div className="p-6 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-8 bg-amber-500 rounded-full" />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              {texts.places}
            </p>
          </div>

          {places.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 opacity-60">
              <span className="text-6xl mb-4 grayscale">🗺️</span>
              <p className="text-sm font-medium">Nenhum lugar cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {places
                .sort((a, b) => a.order - b.order)
                .map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <div 
                      key={place.id} 
                      className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? 'border-amber-400 shadow-md ring-1 ring-amber-100 transform scale-[1.01]'
                          : 'border-stone-200 hover:border-amber-200 hover:shadow-md'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedPlace(isSelected ? null : place)}
                        className="w-full text-left p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`text-3xl flex-shrink-0 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                            {place.icon || CATEGORY_COLORS[place.category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-stone-800 text-lg leading-tight">
                              {place.name[language]}
                            </h3>
                            <p className={`text-sm text-stone-500 mt-2 leading-relaxed transition-all duration-300 ${
                              isSelected ? 'line-clamp-none' : 'line-clamp-2'
                            }`}>
                              {place.description[language]}
                            </p>
                            
                            {/* Indicador visual de "Ver mais" */}
                            {!isSelected && (
                              <div className="flex items-center gap-1 mt-3 text-amber-700 text-xs font-bold uppercase tracking-wide group-hover:underline">
                                <span>Ver opções de rota</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Painel de Ações Expansível */}
                      {isSelected && (
                        <div className="px-5 pb-5 animate-slide-down">
                          <div className="h-px bg-stone-100 mb-4" />
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* Google Maps */}
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-all active:scale-95 group"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform">🗺️</span>
                              <span className="text-xs font-bold text-stone-600 group-hover:text-amber-800">Google Maps</span>
                            </a>

                            {/* Waze */}
                            <a
                              href={`https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-all active:scale-95 group"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform">🚗</span>
                              <span className="text-xs font-bold text-stone-600 group-hover:text-blue-800">Waze</span>
                            </a>

                            {/* Uber */}
                            <a
                              href={`https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${place.lat}&dropoff[longitude]=${place.lng}&dropoff[nickname]=${encodeURIComponent(place.name[language])}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-800 hover:border-stone-800 hover:text-white transition-all active:scale-95 group"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform">🚕</span>
                              <span className="text-xs font-bold text-stone-600 group-hover:text-white">Uber</span>
                            </a>

                            {/* Apple Maps */}
                            <a
                              href={`https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=d`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sm:hidden flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-green-50 hover:border-green-200 hover:text-green-800 transition-all active:scale-95 group"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform">🍎</span>
                              <span className="text-xs font-bold text-stone-600 group-hover:text-green-800">Maps</span>
                            </a>
                          </div>

                          {/* Botão de Copiar Coordenadas (Full Width) */}
                          <button
                            onClick={() => handleCopyCoords(place.lat, place.lng)}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-stone-300 text-stone-400 text-xs hover:border-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all active:scale-[0.99]"
                          >
                            <span className="font-mono opacity-70">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                            <span className="px-2 py-0.5 bg-stone-200 rounded text-stone-600 font-bold">COPY</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Adicione estas animações ao seu arquivo CSS global (ex: globals.css) ou styled-components 
   caso não esteja usando Tailwind com o plugin de animação. 
   Se estiver usando Tailwind puro, pode usar utility classes como animate-pulse, etc. 
   Mas aqui simulei classes para clareza. */

/* 
  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .animate-slide-down { animation: slideDown 0.3s ease-out; }
  
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
*/