// ApartmentCard.tsx (versão completa corrigida)
import { useState } from 'react';
import type { Apartment } from '../types';
import { useApartmentActions } from '../hooks/useApartmentActions';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { updateApartmentPhone } from '../services/apartmentService';
import { sendWhatsAppMessage } from '../utils/whatsappMessages';
import { ApartmentHistoryModal } from './ApartmentHistoryModal';
import { ApartmentHeader } from './apartment/ApartmentHeader';
import { ApartmentGuestInfo } from './apartment/ApartmentGuestInfo';
import { ApartmentItemsControl } from './apartment/ApartmentItemsControl';
import { ApartmentActions } from './apartment/ApartmentActions';
import { CheckinModal } from './apartment/CheckinModal';
import { CheckoutModal } from './apartment/CheckoutModal';
import { EditPhoneModal } from './apartment/EditPhoneModal';
import { LanguageSelectionModal } from './apartment/LanguageSelectionModal';

interface ApartmentCardProps {
  aptNumber: number;
  data: Apartment;
  onSuccess?: () => void;
}

type Language = 'pt' | 'es' | 'en';

export function ApartmentCard({ aptNumber, data, onSuccess }: ApartmentCardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { loading, handleCheckin, handleCheckout, handleAdjust } = useApartmentActions();
  
  // Estados dos modais
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  
  // Estados auxiliares
  const [pendingCheckinData, setPendingCheckinData] = useState<any>(null);

  // Handler para confirmar check-in
  const onCheckinConfirm = async (data: { guestName: string; pax: number; phone: string; countryCode: string }) => {
    const { guestName, pax, phone } = data; // Removido 'countryCode' daqui pois não é usado neste escopo
    
    // VERIFICAÇÃO CORRIGIDA: Se tiver telefone (mesmo que curto), mostra modal de idioma
    if (phone && phone.trim()) {
      setPendingCheckinData(data);
      setShowLanguageModal(true);
    } else {
      // Sem telefone, faz check-in direto
      const result = await handleCheckin(aptNumber, guestName, pax, '');
      if (result.success) {
        showToast(`Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
        setShowCheckinModal(false);
        onSuccess?.();
      } else {
        showToast(`Erro no check-in: ${result.error}`, 'error');
      }
    }
  };

  // Handler para confirmar com idioma e enviar mensagem
  const confirmWithLanguage = async (language: Language) => {
    if (!pendingCheckinData) return;
    
    const { guestName, pax, phone, countryCode } = pendingCheckinData;
    const fullPhone = `${countryCode} ${phone}`;
    const result = await handleCheckin(aptNumber, guestName, pax, fullPhone);
    
    if (result.success) {
      showToast(`Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
      
      // Envia mensagem WhatsApp (mesmo com número curto)
      if (phone && phone.trim()) {
        const userName = user?.name || (language === 'pt' ? 'Equipe Hotel da Pipa' : language === 'es' ? 'Equipo Hotel da Pipa' : 'Hotel da Pipa Team');
        sendWhatsAppMessage(phone, countryCode, guestName, aptNumber, language, userName);
        const languageName = language === 'pt' ? 'Português' : language === 'es' ? 'Español' : 'English';
        showToast(`Mensagem de boas-vindas enviada (${languageName})!`, 'info');
      }
      
      setShowLanguageModal(false);
      setShowCheckinModal(false);
      setPendingCheckinData(null);
      onSuccess?.();
    } else {
      showToast(`Erro no check-in: ${result.error}`, 'error');
    }
  };

  // Handler para check-out
  const onCheckoutConfirm = async (lostTowelsCount: number) => {
    const result = await handleCheckout(aptNumber, lostTowelsCount);
    if (result.success) {
      if (lostTowelsCount > 0) {
        showToast(`Check-out realizado! ${lostTowelsCount} toalha(s) registrada(s) como perda`, 'warning');
      } else {
        showToast(`Check-out realizado! Apto ${aptNumber} liberado`, 'success');
      }
      setShowCheckoutModal(false);
      onSuccess?.();
    } else {
      const errorMsg = 'error' in result ? result.error : 'Erro desconhecido';
      showToast(`Erro no check-out: ${errorMsg}`, 'error');
    }
  };

  // Handler para editar telefone
  const onEditPhoneConfirm = async (phone: string, countryCode: string) => {
    const fullPhone = `${countryCode} ${phone}`;
    const result = await updateApartmentPhone(aptNumber, fullPhone);
    
    if (result.success) {
      showToast(`Telefone atualizado com sucesso!`, 'success');
      setShowEditPhoneModal(false);
      
      // Pergunta se quer enviar mensagem
      if (confirm('Deseja enviar a mensagem de boas-vindas para o novo número?')) {
        setPendingCheckinData({
          guestName: data.guest || '',
          pax: data.pax || 1,
          phone,
          countryCode
        });
        setShowLanguageModal(true);
      }
      onSuccess?.();
    } else {
      showToast(`Erro ao atualizar telefone: ${result.error}`, 'error');
    }
  };

  // Handler para ajustar fichas/toalhas
  const onAdjustItem = async (item: 'chips' | 'towels', delta: number) => {
    const currentValue = item === 'chips' ? data.chips : data.towels;
    await handleAdjust(aptNumber, item, delta, currentValue);
    
    const messages = {
      chips: { up: 'Ficha adicionada', down: 'Ficha retirada' },
      towels: { up: 'Toalha entregue', down: 'Toalha devolvida' }
    };
    const action = delta > 0 ? 'up' : 'down';
    showToast(`${messages[item][action]}`, 'info');
  };

  // Bloco e exibição de itens
  const blockAndItems = (
    <div className="flex items-center gap-1 mb-2">
      <div className="text-xs text-gray-500 dark:text-gray-400">{data.block}</div>
      {data.occupied && (
        <div className="flex gap-1 ml-auto">
          {data.towels > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded-full">
              Toalhas: {data.towels}
            </span>
          )}
          {data.chips > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
              Fichas: {data.chips}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={`
        border rounded-lg p-3 transition-all hover:shadow-md
        ${data.occupied 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}>
        <ApartmentHeader 
          aptNumber={aptNumber}
          isOccupied={data.occupied}
          onEditPhone={data.occupied ? () => setShowEditPhoneModal(true) : undefined}
        />
        
        <ApartmentGuestInfo 
          guest={data.guest}
          phone={data.phone}
        />
        
        {blockAndItems}

        {data.occupied && (
          <ApartmentItemsControl
            chips={data.chips}
            towels={data.towels}
            loading={loading}
            onAdjust={onAdjustItem}
          />
        )}

        <ApartmentActions
          isOccupied={data.occupied}
          loading={loading}
          onCheckin={() => setShowCheckinModal(true)}
          onCheckout={() => {
            setShowCheckoutModal(true);
          }}
          onHistory={() => setShowHistoryModal(true)}
        />
      </div>

      {/* Modais */}
      <CheckinModal
        isOpen={showCheckinModal}
        aptNumber={aptNumber}
        loading={loading}
        onClose={() => setShowCheckinModal(false)}
        onConfirm={onCheckinConfirm}
      />

      <LanguageSelectionModal
        isOpen={showLanguageModal}
        guestName={pendingCheckinData?.guestName}
        onSelect={confirmWithLanguage}
        onCancel={() => {
          setShowLanguageModal(false);
          setPendingCheckinData(null);
        }}
      />

      <CheckoutModal
        isOpen={showCheckoutModal}
        aptNumber={aptNumber}
        guest={data.guest}
        phone={data.phone}
        chips={data.chips}
        towels={data.towels}
        loading={loading}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={onCheckoutConfirm}
      />

      <EditPhoneModal
        isOpen={showEditPhoneModal}
        aptNumber={aptNumber}
        guest={data.guest}
        currentPhone={data.phone}
        loading={loading}
        onClose={() => setShowEditPhoneModal(false)}
        onConfirm={onEditPhoneConfirm}
      />

      <ApartmentHistoryModal
        isOpen={showHistoryModal}
        aptNumber={aptNumber}
        guestName={data.guest}
        blockName={data.block}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
}