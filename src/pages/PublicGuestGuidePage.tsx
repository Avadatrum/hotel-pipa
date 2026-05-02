// src/pages/PublicGuestGuidePage.tsx

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestGuide } from '../hooks/useGuestGuide';
import { TideWidgetPremium } from '../components/TabuaMare/TideWidgetPremium';
import { PDFViewerModal } from '../components/guestGuide/PDFViewerModal';
import { useTranslation } from '../utils/guideTranslations';
import { requestTaxi } from '../services/taxiService';
import type { GuideLanguage } from '../types/guestGuide.types';

// ─── Ícones (SVG inline) ─────────────────────────────
const WifiIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const ClockIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UtensilsIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const DrinkIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const TourIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = (): React.ReactElement => (
  <svg className="w-8 h-8 text-amber-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const RefreshIcon = (): React.ReactElement => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const InfoIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BeachIcon = (): React.ReactElement => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-7 9.88L5 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 14.5l-3-3" />
  </svg>
);

const CopyIcon = (): React.ReactElement => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = (): React.ReactElement => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const TaxiIcon = (): React.ReactElement => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4-8v4m-6 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3" />
  </svg>
);

// ─── URLs dos PDFs ──────────────────────────────────
const RESTAURANT_PDF = '/pdfs/cardapio-restaurante.pdf';
const FRIGOBAR_PDF = '/pdfs/cardapio-frigobar.pdf';

// ─── Loading Screen ──────────────────────────────────────

function LoadingScreen({ t }: { t: (key: any) => string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-nunito">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin" />
        <p className="text-stone-600 font-semibold text-base tracking-wide">{t('loading')}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, t }: { message: string; t: (key: any) => string }) {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-nunito">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-amber-100">
        <div className="mb-6">
          <WarningIcon />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-3">{t('error_title')}</h1>
        <p className="text-stone-500 mb-8 text-sm leading-relaxed">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3.5 bg-stone-800 text-white text-sm font-bold rounded-2xl hover:bg-stone-900 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshIcon /> {t('try_again')}
        </button>
      </div>
    </div>
  );
}

// ─── Guest Header ────────────────────────────────────

function GuestHeader({ 
  guestName, 
  aptNumber, 
  towels, 
  chips,
  t
}: { 
  guestName: string; 
  aptNumber: number; 
  towels: number; 
  chips: number;
  t: (key: any) => string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-amber-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-700 to-amber-900"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-amber-800 text-xs font-extrabold uppercase tracking-wider mb-1">
            {t('hello_welcome')}
          </p>
          <h1 className="text-3xl font-extrabold text-stone-800">{guestName}</h1>
        </div>
        <div className="bg-stone-800 text-white px-6 py-4 rounded-2xl shadow-md text-center min-w-[100px]">
          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">{t('suite')}</p>
          <p className="text-3xl font-extrabold">{aptNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-800">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </span>
            <p className="text-xs font-bold text-amber-900 uppercase">{t('towels')}</p>
          </div>
          <p className="text-3xl font-bold text-stone-800">{towels}</p>
        </div>
        <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-stone-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </span>
            <p className="text-xs font-bold text-stone-800 uppercase">{t('chips')}</p>
          </div>
          <p className="text-3xl font-bold text-stone-800">{chips}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Guide Card (Acordeão) ─────────────────────────

function GuideCard({ 
  icon: Icon, 
  title, 
  children,
  defaultOpen = false 
}: { 
  icon: () => React.ReactElement; 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden mb-4 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group active:bg-stone-100"
      >
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 text-amber-800 p-2.5 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
            <Icon />
          </div>
          <span className="font-bold text-stone-800 text-lg">{title}</span>
        </div>
        <span className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-0 text-stone-600 text-sm leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── PDF Card ──────────────────────────────────────

function PDFCard({ 
  icon: Icon, 
  title, 
  subtitle,
  onClick
}: { 
  icon: () => React.ReactElement; 
  title: string; 
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-3xl shadow-sm border border-stone-100 p-5 flex items-center justify-between hover:bg-amber-50 hover:border-amber-100 transition-all hover:shadow-md group mb-4 active:scale-[0.99] text-left"
    >
      <div className="flex items-center gap-4">
        <div className="bg-amber-50 text-amber-800 p-2.5 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
          <Icon />
        </div>
        <div>
          <span className="font-bold text-stone-800 text-lg block">{title}</span>
          {subtitle && <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{subtitle}</span>}
        </div>
      </div>
      <span className="bg-stone-100 text-stone-400 p-2 rounded-full group-hover:bg-amber-800 group-hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </span>
    </button>
  );
}

// ─── Link Card ──────────────────────────────────────

function LinkCard({ 
  icon: Icon, 
  title, 
  subtitle,
  href
}: { 
  icon: () => React.ReactElement; 
  title: string; 
  subtitle?: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 flex items-center justify-between hover:bg-amber-50 hover:border-amber-100 transition-all hover:shadow-md group mb-4 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="bg-amber-50 text-amber-800 p-2.5 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
          <Icon />
        </div>
        <div>
          <span className="font-bold text-stone-800 text-lg block">{title}</span>
          {subtitle && <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{subtitle}</span>}
        </div>
      </div>
      <span className="bg-stone-100 text-stone-400 p-2 rounded-full group-hover:bg-amber-800 group-hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </span>
    </a>
  );
}

// ─── Schedule Item ──────────────────────────────────

function ScheduleItem({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-3 px-4 rounded-2xl transition-colors ${
      highlight 
        ? 'bg-red-50 border border-red-100' 
        : 'bg-stone-50'
    }`}>
      <span className="text-sm font-bold text-stone-600">{label}</span>
      <span className={`text-sm font-bold ${
        highlight ? 'text-red-700' : 'text-stone-800'
      }`}>
        {value}
      </span>
    </div>
  );
}

// ─── Botão Copiar ───────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
        copied
          ? 'bg-emerald-500 text-white'
          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
      }`}
    >
      {copied ? (
        <>
          <CheckIcon /> Copiado!
        </>
      ) : (
        <>
          <CopyIcon /> Copiar senha
        </>
      )}
    </button>
  );
}

// ─── Página Principal ───────────────────────────────

export function PublicGuestGuidePage() {
  const { aptNumber, token } = useParams<{ aptNumber: string; token: string }>();
  const { token: tokenData, apartment, config, loading, error } = useGuestGuide(
    Number(aptNumber), 
    token || ''
  );
  
  const [language, setLanguage] = useState<GuideLanguage>(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('es')) return 'es';
    return 'en';
  });

  // Estados para modais de PDF
  const [showRestaurantPDF, setShowRestaurantPDF] = useState(false);
  const [showFrigobarPDF, setShowFrigobarPDF] = useState(false);

  // 🆕 Estados para solicitação de táxi
  const [taxiRequested, setTaxiRequested] = useState(false);
  const [taxiLoading, setTaxiLoading] = useState(false);

  const { t } = useTranslation(language);

  // 🆕 Handler de solicitação de táxi
  const handleTaxiRequest = async () => {
    setTaxiLoading(true);
    
    try {
      const success = await requestTaxi(
        Number(aptNumber),
        tokenData?.guestName || 'Hóspede',
        apartment?.phone
      );
      
      if (success) {
        setTaxiRequested(true);
      } else {
        alert(
          language === 'pt' 
            ? 'Você já possui uma solicitação de táxi em andamento. Aguarde a recepção atender.'
            : language === 'es'
              ? 'Ya tienes una solicitud de taxi en curso. Espera a que la recepción atienda.'
              : 'You already have a taxi request in progress. Please wait for reception to attend.'
        );
      }
    } catch (error) {
      console.error('Erro ao solicitar táxi:', error);
    } finally {
      setTaxiLoading(false);
    }
  };

  if (loading) return <LoadingScreen t={t} />;
  if (error || !tokenData || !apartment || !config) {
    return <ErrorScreen message={error || 'Erro ao carregar o guia.'} t={t} />;
  }

  const content = config.content[language];
  const isOccupied = apartment.occupied;

  if (!isOccupied) {
    return (
      <ErrorScreen message="Este guia não está mais disponível. Obrigado pela sua estadia! 👋" t={t} />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-nunito selection:bg-amber-200 selection:text-amber-900">
      {/* Cabeçalho fixo */}
      <div className="bg-white/90 backdrop-blur-md border-b border-stone-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center text-white shadow-md">
              <span className="font-extrabold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900 leading-none">Hotel da Pipa</h1>
              <p className="text-[11px] text-stone-500 uppercase font-bold tracking-wider mt-1">{t('host_guide')}</p>
            </div>
          </div>
          
          <div className="flex bg-stone-100 rounded-2xl p-1">
            {(['pt', 'es', 'en'] as GuideLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  language === lang
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <GuestHeader
          guestName={tokenData.guestName}
          aptNumber={Number(aptNumber)}
          towels={apartment.towels || 0}
          chips={apartment.chips || 0}
          t={t}
        />

        {/* Gastronomia */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('gastronomy')}</p>
          <PDFCard icon={UtensilsIcon} title={t('restaurant')} subtitle={t('full_menu')} onClick={() => setShowRestaurantPDF(true)} />
          <PDFCard icon={DrinkIcon} title={t('minibar')} subtitle={t('drinks_snacks')} onClick={() => setShowFrigobarPDF(true)} />
        </div>

        {/* Informações do Quarto */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('room_info')}</p>
          
          <GuideCard icon={WifiIcon} title={t('wifi_title')} defaultOpen>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t('wifi_network')}</p>
                <p className="text-lg font-bold text-stone-800">{content.wifi.network}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase mb-2">{t('wifi_password')}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-lg font-bold text-stone-800 bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                    {content.wifi.password}
                  </p>
                  <CopyButton text={content.wifi.password} />
                </div>
              </div>
            </div>
          </GuideCard>

          <GuideCard icon={ClockIcon} title={t('schedules_title')}>
            <div className="space-y-3">
              <ScheduleItem label={t('breakfast')} value={content.schedules.breakfast} />
              <ScheduleItem label={t('afternoon_tea')} value={content.schedules.afternoonTea} />
              <ScheduleItem label={t('lunch_dinner')} value={content.schedules.restaurant} />
              <ScheduleItem label={t('pool')} value={content.schedules.pool} />
              <ScheduleItem label={t('checkout')} value={content.schedules.checkout} highlight />
            </div>
          </GuideCard>
        </div>

        {/* Regras */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('norms_rules')}</p>
          <GuideCard icon={InfoIcon} title={t('rules_title')}>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              {content.rules.map((rule, index) => (
                <div key={index} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: rule }} />
              ))}
            </div>
          </GuideCard>
        </div>

        {/* Praias */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('beaches_nature')}</p>
          <GuideCard icon={BeachIcon} title={t('beach_info_title')}>
            <div className="prose prose-sm max-w-none text-stone-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: content.beachInfo }} />
          </GuideCard>
        </div>

        {/* Serviços & Lazer */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('services_leisure')}</p>
          
          <LinkCard icon={TourIcon} title={t('tours_title')} subtitle={t('tours_subtitle')} href="https://wa.me/5584981328284?text=Olá! Gostaria de saber mais sobre os passeios disponíveis." />
          
          <div className="mb-4">
            <TideWidgetPremium />
          </div>
        </div>

        {/* 🆕 Seção de Transporte / Táxi */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">
            {language === 'pt' ? 'Transporte' : language === 'es' ? 'Transporte' : 'Transport'}
          </p>
          
          {taxiRequested ? (
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-center">
              <div className="text-5xl mb-3">🚕</div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">
                {language === 'pt' ? 'Táxi Solicitado!' : language === 'es' ? '¡Taxi Solicitado!' : 'Taxi Requested!'}
              </h3>
              <p className="text-sm text-emerald-600">
                {language === 'pt' 
                  ? 'A recepção foi notificada e já está providenciando seu táxi. Obrigado pela paciência!' 
                  : language === 'es'
                    ? 'La recepción ha sido notificada y ya está organizando su taxi. ¡Gracias por su paciencia!'
                    : 'Reception has been notified and is arranging your taxi. Thank you for your patience!'}
              </p>
            </div>
          ) : (
            <button
              onClick={handleTaxiRequest}
              disabled={taxiLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] group border-2 border-yellow-300 disabled:opacity-70 disabled:cursor-wait"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black/10 p-3 rounded-2xl">
                  <TaxiIcon />
                </div>
                <div className="text-left flex-1">
                  <span className="font-extrabold text-stone-800 text-lg block">
                    {language === 'pt' ? 'Chamar Táxi' : language === 'es' ? 'Pedir Taxi' : 'Call a Taxi'}
                  </span>
                  <span className="text-xs font-bold text-stone-600 uppercase">
                    {language === 'pt' ? 'Toque para solicitar' : language === 'es' ? 'Toque para solicitar' : 'Tap to request'}
                  </span>
                </div>
                <div className="bg-black/10 p-2 rounded-full group-hover:bg-black/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              {taxiLoading && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-4 h-4 border-2 border-stone-700 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-stone-700">
                    {language === 'pt' ? 'Solicitando...' : language === 'es' ? 'Solicitando...' : 'Requesting...'}
                  </span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Atendimento */}
        <div className="mb-8">
          <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t('support')}</p>
          
          <a
            href={`https://wa.me/${content.contacts.reception.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-emerald-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-100 hover:bg-emerald-800 hover:shadow-xl transition-all active:scale-[0.99] mb-4 group"
          >
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-90 font-bold mb-1">{t('reception_whatsapp')}</p>
              <p className="text-lg font-bold">{content.contacts.reception}</p>
            </div>
          </a>

          <div className="bg-red-50 rounded-3xl p-5 border border-red-100 flex items-start gap-4">
            <div className="text-3xl">🚨</div>
            <div>
              <p className="text-xs font-bold text-red-800 uppercase mb-1">{t('emergency_title')}</p>
              <p className="text-base font-bold text-red-900">{content.contacts.emergency}</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-12 pt-8 border-t border-stone-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-700"></div>
            <p className="text-sm font-bold text-stone-500">Hotel da Pipa</p>
            <div className="w-2 h-2 rounded-full bg-amber-700"></div>
          </div>
          <p className="text-xs text-stone-400 font-medium">{t('footer_location')}</p>
        </div>
      </main>

      {/* Modal do Cardápio Restaurante */}
      <PDFViewerModal
        isOpen={showRestaurantPDF}
        pdfUrl={RESTAURANT_PDF}
        title={t('restaurant')}
        onClose={() => setShowRestaurantPDF(false)}
      />

      {/* Modal do Cardápio Frigobar */}
      <PDFViewerModal
        isOpen={showFrigobarPDF}
        pdfUrl={FRIGOBAR_PDF}
        title={t('minibar')}
        onClose={() => setShowFrigobarPDF(false)}
      />
    </div>
  );
}