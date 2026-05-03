// src/pages/PublicGuestGuidePage.tsx

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestGuide } from '../hooks/useGuestGuide';
import { TideWidgetPremium } from '../components/TabuaMare/TideWidgetPremium';
import { useTranslation } from '../utils/guideTranslations';
import type { GuideLanguage } from '../types/guestGuide.types';
import {
  HeroHeader,
  NavigationMenu,
  GuestHeader,
  GuideCard,
  PDFCard,
  LinkCard,
  CopyButton,
  ScheduleItem,
  TaxiSection,
  LoadingScreen,
  ErrorScreen,
  PDFViewerModal,
  type SectionId
} from '../components/guestGuide';
import {
  WifiIcon,
  ClockIcon,
  UtensilsIcon,
  DrinkIcon,
  TourIcon,
  InfoIcon,
  BeachIcon
} from '../components/guestGuide/icons';
import { PlacesMapModal } from '../components/guestGuide/PlacesMapModal'; // 🆕

// ─── URLs dos PDFs ──────────────────────────────────
const RESTAURANT_PDF = 'https://drive.google.com/file/d/1-EW5v4F0MSwu_dSI4t1jeZS_ztmn716R/preview';
const FRIGOBAR_PDF = 'https://drive.google.com/file/d/1J5CdW1SRDtfi9oecYwJW1lttHdSwhcl1/preview';

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

  const [showRestaurantPDF, setShowRestaurantPDF] = useState(false);
  const [showFrigobarPDF, setShowFrigobarPDF] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('inicio');
  const [showPlacesModal, setShowPlacesModal] = useState(false); // 🆕

  const { t } = useTranslation(language);

  const handleNavigate = (sectionId: SectionId) => {
    if (sectionId === 'como-chegar') { // 🆕
      setShowPlacesModal(true);
      return;
    }
    setActiveSection(sectionId);
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <LoadingScreen t={t} />;
  if (error || !tokenData || !apartment || !config) {
    return <ErrorScreen message={error || 'Erro ao carregar o guia.'} t={t} />;
  }

  const content = config.content[language];

  if (!apartment.occupied) {
    return <ErrorScreen message="Este guia não está mais disponível. Obrigado pela sua estadia! 👋" t={t} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-nunito selection:bg-amber-200 selection:text-amber-900">
      
      {/* Hero */}
      <HeroHeader 
        aptNumber={Number(aptNumber)} 
        guestName={tokenData.guestName} 
        language={language} 
        onLanguageChange={setLanguage} 
      />

      {/* Navegação */}
      <NavigationMenu language={language} activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="max-w-2xl mx-auto px-5 py-8">
        
        {/* Início */}
        <section id="section-inicio" className="mb-8 scroll-mt-28">
          <GuestHeader
            guestName={tokenData.guestName}
            aptNumber={Number(aptNumber)}
            towels={apartment.towels || 0}
            chips={apartment.chips || 0}
            t={t}
          />
        </section>

        {/* Wi-Fi + Horários */}
        <section id="section-wifi" className="mb-8 scroll-mt-28">
          <SectionLabel>{t('room_info')}</SectionLabel>
          
          <GuideCard icon={WifiIcon} title={t('wifi_title')} defaultOpen>
            <div className="space-y-4">
              <div>
                <Label>{t('wifi_network')}</Label>
                <Value>{content.wifi.network}</Value>
              </div>
              <div>
                <Label className="mb-2">{t('wifi_password')}</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <Value className="bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                    {content.wifi.password}
                  </Value>
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
        </section>

        {/* Regras */}
        <section id="section-regras" className="mb-8 scroll-mt-28">
          <SectionLabel>{t('norms_rules')}</SectionLabel>
          <GuideCard icon={InfoIcon} title={t('rules_title')}>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              {content.rules.map((rule, index) => (
                <div key={index} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: rule }} />
              ))}
            </div>
          </GuideCard>
        </section>

        {/* Como Chegar / Praias */}
        <section id="section-como-chegar" className="mb-8 scroll-mt-28">
          <SectionLabel>{t('beaches_nature')}</SectionLabel>
          <GuideCard icon={BeachIcon} title={t('beach_info_title')}>
            <div className="prose prose-sm max-w-none text-stone-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: content.beachInfo }} />
          </GuideCard>
        </section>

        {/* Check-in / Gastronomia */}
        <section id="section-checkin" className="mb-8 scroll-mt-28">
          <SectionLabel>{t('gastronomy')}</SectionLabel>
          <PDFCard Icon={UtensilsIcon} title={t('restaurant')} subtitle={t('full_menu')} onClick={() => setShowRestaurantPDF(true)} />
          <PDFCard Icon={DrinkIcon} title={t('minibar')} subtitle={t('drinks_snacks')} onClick={() => setShowFrigobarPDF(true)} />
        </section>

        {/* Mais */}
        <section id="section-mais" className="mb-8 scroll-mt-28">
          
          {/* Transporte */}
          <SectionLabel>{language === 'pt' ? 'Transporte' : language === 'es' ? 'Transporte' : 'Transport'}</SectionLabel>
          <TaxiSection
            aptNumber={Number(aptNumber)}
            guestName={tokenData.guestName}
            phone={apartment.phone}
            language={language}
          />
          
          {/* Serviços */}
          <SectionLabel>{t('services_leisure')}</SectionLabel>
          <LinkCard Icon={TourIcon} title={t('tours_title')} subtitle={t('tours_subtitle')} href="https://wa.me/5584981328284?text=Olá! Gostaria de saber mais sobre os passeios disponíveis." />
          <div className="mb-4">
            <TideWidgetPremium />
          </div>
          
          {/* Atendimento */}
          <SectionLabel>{t('support')}</SectionLabel>
          
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
        </section>

        {/* Rodapé */}
        <footer className="text-center mt-12 pt-8 border-t border-stone-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-700" />
            <p className="text-sm font-bold text-stone-500">Hotel da Pipa</p>
            <div className="w-2 h-2 rounded-full bg-amber-700" />
          </div>
          <p className="text-xs text-stone-400 font-medium">{t('footer_location')}</p>
        </footer>
      </main>

      {/* Modais */}
      <PDFViewerModal isOpen={showRestaurantPDF} pdfUrl={RESTAURANT_PDF} title={t('restaurant')} onClose={() => setShowRestaurantPDF(false)} />
      <PDFViewerModal isOpen={showFrigobarPDF} pdfUrl={FRIGOBAR_PDF} title={t('minibar')} onClose={() => setShowFrigobarPDF(false)} />
      
      {/* 🆕 Modal do Mapa de Lugares */}
      <PlacesMapModal
        isOpen={showPlacesModal}
        places={content.places || []}
        language={language}
        onClose={() => setShowPlacesModal(false)}
      />
    </div>
  );
}

// ─── Subcomponentes inline mínimos ──────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-4 ml-1">{children}</p>;
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold text-stone-400 uppercase mb-1 ${className}`}>{children}</p>;
}

function Value({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-lg font-bold text-stone-800 ${className}`}>{children}</p>;
}