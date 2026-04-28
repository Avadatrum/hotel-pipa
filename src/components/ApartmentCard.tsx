// src/components/ApartmentCard.tsx
import { useState, useCallback, memo } from 'react';
import type { Apartment } from '../types';
import { useApartmentActions } from '../hooks/useApartmentActions';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { updateApartmentPhone } from '../services/apartmentService';
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

  // ── Handlers de Check-in ──────────────────────────────────────────────────

  const onCheckinConfirm = useCallback(
    async (checkinData: CheckinData) => {
      const { guestName, pax, phone, countryCode } = checkinData;
      const fullPhone = phone?.trim() ? `${countryCode} ${phone}` : '';

      // Faz o check-in primeiro
      const result = await handleCheckin(aptNumber, guestName, pax, fullPhone);
      if (result.success) {
        showToast(`Check-in realizado! Apto ${aptNumber} — ${guestName}`, 'success');
        setShowCheckinModal(false);

        // Se tem WhatsApp, pergunta idioma E envia mensagem
        if (phone?.trim()) {
          // NÃO sobrescreve phone com fullPhone — mantém separado!
          setPendingCheckinData({
            guestName,
            pax,
            phone, // número puro (sem código)
            countryCode // código do país
          });
          setShowLanguageModal(true);
        } else {
          // Sem WhatsApp — abre direto o modal do termo
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

      // CORREÇÃO: Definir as variáveis fora do if para uso posterior
      const cleanCode = countryCode.replace(/\D/g, '');
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = `${cleanCode}${cleanPhone}`;
      
      if (phone?.trim()) {
        console.log('📱 Enviando WhatsApp para:', fullPhone); // Debug

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

      // Abrir modal do termo
      setPendingTermGuest(guestName);
      setPendingTermPhone(cleanPhone); // Agora cleanPhone está definido
      setPendingTermCountryCode(cleanCode); // Agora cleanCode está definido
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
    </>
  );
});