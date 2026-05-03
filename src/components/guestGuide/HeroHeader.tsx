// src/components/guestGuide/HeroHeader.tsx

import type { GuideLanguage } from '../../types/guestGuide.types';

interface HeroHeaderProps {
  aptNumber: number;
  guestName: string;
  language: GuideLanguage;
  onLanguageChange: (lang: GuideLanguage) => void;
}

const TITLES: Record<GuideLanguage, string> = {
  pt: 'Guia de Boas-vindas',
  es: 'Guía de Bienvenida',
  en: 'Welcome Guide'
};

const SUBTITLES: Record<GuideLanguage, string> = {
  pt: 'Aqui neste guia você encontra todas as informações necessárias para tornar sua estadia ainda mais especial',
  es: 'Aquí en esta guía encuentras todas las informaciones necesarias para hacer tu estancia aún más especial',
  en: 'Here in this guide you will find all the necessary information to make your stay even more special'
};

const APT_LABEL: Record<GuideLanguage, string> = {
  pt: 'Apartamento',
  es: 'Apartamento',
  en: 'Apartment'
};

const GREETING: Record<GuideLanguage, string> = {
  pt: 'Olá,',
  es: 'Hola,',
  en: 'Hello,'
};

export function HeroHeader({ aptNumber, guestName, language, onLanguageChange }: HeroHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-stone-800 via-stone-700 to-amber-900 text-white relative overflow-hidden pb-8">
      {/* Padrão decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
        <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/5 rounded-full" />
      </div>
      
      <div className="relative max-w-2xl mx-auto px-6 pt-8 pb-4">
        {/* Seletor de idioma no topo */}
        <div className="flex justify-end mb-6">
          <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
            {(['pt', 'es', 'en'] as GuideLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  language === lang
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Badge do apt */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
          <span className="text-amber-300">✦</span>
          <span className="text-sm font-bold tracking-wide">
            {APT_LABEL[language]} {aptNumber}
          </span>
        </div>
        
        {/* Saudação */}
        <p className="text-amber-300 text-sm font-medium uppercase tracking-widest mb-2">
          {GREETING[language]} {guestName}
        </p>
        
        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
          {TITLES[language]}
        </h1>
        
        {/* Subtítulo */}
        <p className="text-white/70 text-base leading-relaxed max-w-lg">
          {SUBTITLES[language]}
        </p>
      </div>
    </div>
  );
}