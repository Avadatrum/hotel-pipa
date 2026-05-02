// src/components/ApartmentCard.tsx
import { useState, useCallback, memo } from 'react';
import type { Apartment } from '../types';
import { useApartmentActions } from '../hooks/useApartmentActions';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { updateApartmentPhone, getGuestGuideLink, getExistingGuideLink } from '../services/apartmentService';
import { sendWhatsAppMessage } from '../utils/whatsappMessages';
import { ApartmentHistoryModal } from '../components/ApartmentHistoryModal';
import { ApartmentHeader } from './apartment/ApartmentHeader';
import { ApartmentGuestInfo } from './apartment/ApartmentGuestInfo';
import { ApartmentItemsControl } from './apartment/ApartmentItemsControl';
import { ApartmentActions } from './apartment/ApartmentActions';
import { CheckinModal } from './apartment/CheckinModal';
import { CheckoutModal } from './apartment/CheckoutModal';
import { EditPhoneModal } from './apartment/EditPhoneModal';
import { LanguageSelectionModal } from './apartment/LanguageSelectionModal';
import { TowelSignatureModal } from './apartment/TowelSignatureModal';
import { TermSignatureModal } from './apartment/TermSignatureModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Language = 'pt' | 'es' | 'en';

interface CheckinData {
  guestName: string;
  pax: number;
  phone: string;
  countryCode: string;
}

interface TowelData {
  operation: 'chips_to_towels' | 'towel_exchange';
  quantity: number;
}

interface ApartmentCardProps {
  aptNumber: number;
  data: Apartment;
  onSuccess?: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<Language, string> = {
  pt: 'Português',
  es: 'Español',
  en: 'English',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const ApartmentCard = memo(function ApartmentCard({
  aptNumber,
  data,
  onSuccess,
}: ApartmentCardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { loading, handleCheckin, handleCheckout, handleAdjust } = useApartmentActions();

  // Estados dos modais
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  const [showTowelModal, setShowTowelModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);

  // Estados auxiliares
  const [pendingCheckinData, setPendingCheckinData] = useState<CheckinData | null>(null);
  const [pendingTowelData, setPendingTowelData] = useState<TowelData | null>(null);
  const [pendingTermGuest, setPendingTermGuest] = useState('');
  const [pendingTermPhone, setPendingTermPhone] = useState('');
  const [pendingTermCountryCode, setPendingTermCountryCode] = useState('+55');
  const [pendingTermPax, setPendingTermPax] = useState(1);

  // 🆕 Estados do Guia do Hóspede
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);
  const [guideLink, setGuideLink] = useState('');
  const [sharingGuide, setSharingGuide] = useState(false);

  // ── Handlers de Check-in ──────────────────────────────────────────────────

  const onCheckinConfirm = useCallback(
    async (checkinData: CheckinData) => {
      const { guestName, pax, phone, countryCode } = checkinData;
      const fullPhone = phone?.trim() ? `${countryCode} ${phone}` : '';

      const result = await handleCheckin(aptNumber, guestName, pax, fullPhone);
      if (result.success) {
        showToast(`Check-in realizado! Apto ${aptNumber} — ${guestName}`, 'success');
        setShowCheckinModal(false);

        if (phone?.trim()) {
          setPendingCheckinData({
            guestName,
            pax,
            phone,
            countryCode
          });
          setShowLanguageModal(true);
        } else {
          setPendingTermGuest(guestName);
          setPendingTermPhone(phone || '');
          setPendingTermCountryCode(countryCode); 
          setPendingTermPax(pax);
          setShowTermModal(true);
        }
        onSuccess?.();
      } else {
        showToast(`Erro no check-in: ${result.error}`, 'error');
      }
    },
    [aptNumber, handleCheckin, onSuccess, showToast],
  );

  const confirmWithLanguage = useCallback(
    async (language: Language) => {
      if (!pendingCheckinData) return;

      const { guestName, pax, phone, countryCode } = pendingCheckinData;

      const cleanCode = countryCode.replace(/\D/g, '');
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = `${cleanCode}${cleanPhone}`;
      
      if (phone?.trim()) {
        console.log('📱 Enviando WhatsApp para:', fullPhone);

        const fallbackName =
          language === 'pt'
            ? 'Equipe Hotel da Pipa'
            : language === 'es'
              ? 'Equipo Hotel da Pipa'
              : 'Hotel da Pipa Team';
        const userName = user?.name ?? fallbackName;
        
        sendWhatsAppMessage(cleanPhone, cleanCode, guestName, aptNumber, language, userName);
        showToast(`Mensagem enviada em ${LANGUAGE_NAMES[language]}!`, 'info');
      }

      setShowLanguageModal(false);

      setPendingTermGuest(guestName);
      setPendingTermPhone(cleanPhone);
      setPendingTermCountryCode(cleanCode);
      setPendingTermPax(pax);
      setShowTermModal(true);

      setPendingCheckinData(null);
    },
    [aptNumber, pendingCheckinData, showToast, user?.name],
  );

  // ── Handler de Check-out ──────────────────────────────────────────────────

  const onCheckoutConfirm = useCallback(
    async (lostTowelsCount: number) => {
      const result = await handleCheckout(aptNumber, lostTowelsCount);

      if (result.success) {
        const msg =
          lostTowelsCount > 0
            ? `Check-out realizado! ${lostTowelsCount} toalha(s) registrada(s) como perda`
            : `Check-out realizado! Apto ${aptNumber} liberado`;
        showToast(msg, lostTowelsCount > 0 ? 'warning' : 'success');
        setShowCheckoutModal(false);
        onSuccess?.();
      } else {
        const errorMsg = 'error' in result ? result.error : 'Erro desconhecido';
        showToast(`Erro no check-out: ${errorMsg}`, 'error');
      }
    },
    [aptNumber, handleCheckout, onSuccess, showToast],
  );

  // ── Handler de Ajuste de Itens ────────────────────────────────────────────

  const onAdjustItem = useCallback(
    async (item: 'chips' | 'towels', _delta: number) => {
      const currentValue = item === 'chips' ? data.chips : data.towels;

      if (currentValue <= 0) {
        showToast('Valor já está em zero', 'error');
        return;
      }

      if (item === 'chips') {
        await handleAdjust(aptNumber, 'chips', -1, currentValue);
        await handleAdjust(aptNumber, 'towels', 1, data.towels);
        showToast('🎫➜🧺 Ficha trocada por toalha', 'info');
      } else {
        await handleAdjust(aptNumber, 'towels', -1, currentValue);
        await handleAdjust(aptNumber, 'chips', 1, data.chips);
        showToast('🧺➜🎫 Toalha devolvida — ficha recuperada', 'info');
      }
    },
    [aptNumber, data.chips, data.towels, handleAdjust, showToast],
  );

  // ── Handler de Edição ─────────────────────────────────────────────────────

  const onEditPhoneConfirm = useCallback(
    async (
      phone: string,
      _countryCode: string,
      chips?: number,
      towels?: number,
      _pax?: number,
    ) => {
      try {
        await updateApartmentPhone(aptNumber, phone);

        if (chips !== undefined && chips !== data.chips) {
          await handleAdjust(aptNumber, 'chips', chips - data.chips, data.chips);
        }

        if (towels !== undefined && towels !== data.towels) {
          await handleAdjust(aptNumber, 'towels', towels - data.towels, data.towels);
        }

        showToast('Dados atualizados com sucesso!', 'success');
        setShowEditPhoneModal(false);
        onSuccess?.();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        showToast(`Erro ao atualizar: ${msg}`, 'error');
      }
    },
    [aptNumber, data.chips, data.towels, handleAdjust, onSuccess, showToast],
  );

  // ── Handler de Assinatura de Toalha ──────────────────────────────────────

  const handleRequestSignature = useCallback(() => {
    if (data.towels <= 0) {
      showToast('Não há toalhas para registrar assinatura', 'warning');
      return;
    }

    const operation = data.chips > 0 ? 'chips_to_towels' : 'towel_exchange';
    setPendingTowelData({ operation, quantity: data.towels });
    setShowTowelModal(true);
  }, [data.chips, data.towels, showToast]);

  const handleTowelSignatureSuccess = useCallback(() => {
    setShowTowelModal(false);
    setPendingTowelData(null);
    showToast('Assinatura registrada com sucesso!', 'success');
    onSuccess?.();
  }, [onSuccess, showToast]);

  // ── Handlers do Termo ────────────────────────────────────────────────────

  const handleTermSuccess = useCallback(() => {
    setShowTermModal(false);
    showToast('Termo assinado com sucesso!', 'success');
  }, [showToast]);

  const handleTermSkip = useCallback(() => {
    setShowTermModal(false);
    showToast('Termo poderá ser assinado depois', 'info');
  }, [showToast]);

  const closeTerm = useCallback(() => {
    setShowTermModal(false);
  }, []);

  // ── Handler do Guia do Hóspede 🆕 ────────────────────────────────────────

  const handleShareGuide = useCallback(async () => {
    setSharingGuide(true);
    
    try {
      let link = await getExistingGuideLink(aptNumber);
      
      if (!link) {
        link = await getGuestGuideLink(aptNumber, data.guest, data.phone);
      }
      
      setGuideLink(link);
      setShowShareGuideModal(true);
    } catch (error) {
      showToast('Erro ao gerar link do guia', 'error');
    } finally {
      setSharingGuide(false);
    }
  }, [aptNumber, data.guest, data.phone, showToast]);

  // ── Handlers de modal simplificados ──────────────────────────────────────

  const openCheckin = useCallback(() => setShowCheckinModal(true), []);
  const openCheckout = useCallback(() => setShowCheckoutModal(true), []);
  const openHistory = useCallback(() => setShowHistoryModal(true), []);
  const openEditPhone = useCallback(() => setShowEditPhoneModal(true), []);

  const closeCheckin = useCallback(() => setShowCheckinModal(false), []);
  const closeLanguage = useCallback(() => {
    setShowLanguageModal(false);
    setPendingCheckinData(null);
  }, []);
  const closeCheckout = useCallback(() => setShowCheckoutModal(false), []);
  const closeEditPhone = useCallback(() => setShowEditPhoneModal(false), []);
  const closeHistory = useCallback(() => setShowHistoryModal(false), []);
  const closeTowel = useCallback(() => {
    setShowTowelModal(false);
    setPendingTowelData(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const hasBadges = data.occupied && (data.towels > 0 || data.chips > 0);

  return (
    <>
      <article
        className={`
          border rounded-xl p-3 transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-400
          ${data.occupied
            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
        `}
        aria-label={`Apartamento ${aptNumber}${data.occupied ? `, ocupado por ${data.guest}` : ', disponível'}`}
      >
        {/* Cabeçalho com bloco e badges */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{data.block}</span>

          {hasBadges && (
            <div className="flex gap-1" aria-label="Itens do apartamento">
              {data.towels > 0 && (
                <span
                  className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded-full font-semibold"
                  aria-label={`${data.towels} toalha(s)`}
                >
                  🧺 {data.towels}
                </span>
              )}
              {data.chips > 0 && (
                <span
                  className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-semibold"
                  aria-label={`${data.chips} ficha(s)`}
                >
                  🎫 {data.chips}
                </span>
              )}
            </div>
          )}
        </div>

        <ApartmentHeader
          aptNumber={aptNumber}
          isOccupied={data.occupied}
          onEditPhone={data.occupied ? openEditPhone : undefined}
        />

        <ApartmentGuestInfo guest={data.guest} phone={data.phone} />

        {data.occupied && (
          <>
            <ApartmentItemsControl
              chips={data.chips}
              towels={data.towels}
              loading={loading}
              onAdjust={onAdjustItem}
            />

            <button
              onClick={handleRequestSignature}
              disabled={loading || data.towels <= 0}
              aria-label="Registrar assinatura digital de toalhas"
              className="
                w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-medium
                flex items-center justify-center gap-1.5 transition-all duration-150
                bg-amber-50 dark:bg-amber-900/20
                border border-amber-300 dark:border-amber-700
                text-amber-800 dark:text-amber-200
                hover:bg-amber-100 dark:hover:bg-amber-900/40
                active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
              "
            >
              ✍️ Registrar assinatura digital
            </button>
          </>
        )}

        <ApartmentActions
          isOccupied={data.occupied}
          loading={loading}
          onCheckin={openCheckin}
          onCheckout={openCheckout}
          onHistory={openHistory}
          onShareGuide={handleShareGuide}
        />
      </article>

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      <CheckinModal
        isOpen={showCheckinModal}
        aptNumber={aptNumber}
        loading={loading}
        onClose={closeCheckin}
        onConfirm={onCheckinConfirm}
      />

      <LanguageSelectionModal
        isOpen={showLanguageModal}
        guestName={pendingCheckinData?.guestName}
        onSelect={confirmWithLanguage}
        onCancel={closeLanguage}
      />

      <CheckoutModal
        isOpen={showCheckoutModal}
        aptNumber={aptNumber}
        guest={data.guest}
        phone={data.phone}
        chips={data.chips}
        towels={data.towels}
        loading={loading}
        onClose={closeCheckout}
        onConfirm={onCheckoutConfirm}
      />

      <EditPhoneModal
        isOpen={showEditPhoneModal}
        aptNumber={aptNumber}
        guest={data.guest}
        currentPhone={data.phone}
        currentChips={data.chips}
        currentTowels={data.towels}
        loading={loading}
        onClose={closeEditPhone}
        onConfirm={onEditPhoneConfirm}
      />

      <ApartmentHistoryModal
        isOpen={showHistoryModal}
        aptNumber={aptNumber}
        guestName={data.guest}
        blockName={data.block}
        onClose={closeHistory}
      />

      {pendingTowelData && (
        <TowelSignatureModal
          isOpen={showTowelModal}
          aptNumber={aptNumber}
          guestName={data.guest ?? ''}
          operation={pendingTowelData.operation}
          quantity={pendingTowelData.quantity}
          onClose={closeTowel}
          onSuccess={handleTowelSignatureSuccess}
        />
      )}

      <TermSignatureModal
        isOpen={showTermModal}
        aptNumber={aptNumber}
        guestName={pendingTermGuest}
        phone={pendingTermPhone}
        countryCode={pendingTermCountryCode}
        pax={pendingTermPax}
        onClose={closeTerm}
        onSuccess={handleTermSuccess}
        onSkip={handleTermSkip}
      />

      {/* 🆕 Modal de Compartilhar Guia do Hóspede */}
      {showShareGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
              📱 Guia do Hóspede
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Compartilhe este link com {data.guest} para acessar o guia digital:
            </p>
            
            {sharingGuide ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Gerando link...</span>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Link do guia:</p>
                  <p className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                    {guideLink}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(guideLink);
                      showToast('Link copiado! 📋', 'success');
                    }}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    📋 Copiar Link
                  </button>
                  
                  {data.phone && (
                    <button
                      onClick={() => {
                        const message = encodeURIComponent(
                          `Olá ${data.guest}! 🌊\n\n` +
                          `Acesse seu Guia Digital do Hotel da Pipa com todas as informações da sua estadia:\n\n` +
                          `${guideLink}\n\n` +
                          `Dúvidas? É só chamar! 😊`
                        );
                        window.open(`https://wa.me/${data.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
                      }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                    >
                      💬 WhatsApp
                    </button>
                  )}
                </div>
                
                {!data.phone && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
                    ⚠️ Hóspede sem WhatsApp cadastrado. Compartilhe o link manualmente.
                  </p>
                )}
              </>
            )}
            
            <button
              onClick={() => {
                setShowShareGuideModal(false);
                setGuideLink('');
              }}
              disabled={sharingGuide}
              className="w-full mt-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
});