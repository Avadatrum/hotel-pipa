// src/components/ApartmentCard.tsx - VERSÃO ATUALIZADA
import { useState } from 'react';
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
  const [showTowelModal, setShowTowelModal] = useState(false);
  
  // Estados auxiliares
  const [pendingCheckinData, setPendingCheckinData] = useState<any>(null);
  const [pendingTowelData, setPendingTowelData] = useState<{
    operation: 'chips_to_towels' | 'towel_exchange';
    quantity: number;
  } | null>(null);

  // Handler para confirmar check-in
  const onCheckinConfirm = async (data: { guestName: string; pax: number; phone: string; countryCode: string }) => {
    const { guestName, pax, phone } = data;
    
    if (phone && phone.trim()) {
      setPendingCheckinData(data);
      setShowLanguageModal(true);
    } else {
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

  // Handler para confirmar com idioma
  const confirmWithLanguage = async (language: Language) => {
    if (!pendingCheckinData) return;
    
    const { guestName, pax, phone, countryCode } = pendingCheckinData;
    const fullPhone = `${countryCode} ${phone}`;
    const result = await handleCheckin(aptNumber, guestName, pax, fullPhone);
    
    if (result.success) {
      showToast(`Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
      
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

  // ApartmentCard.tsx - Lógica onAdjustItem CORRIGIDA
  const onAdjustItem = async (item: 'chips' | 'towels', delta: number) => {
    const currentValue = item === 'chips' ? data.chips : data.towels;
    const newValue = currentValue + delta;
    
    // Validações básicas
    if (newValue < 0) {
      showToast('Valor não pode ficar negativo', 'error');
      return;
    }

    // 1. Entrega de Toalha (+)
    // O operador clica em "+ Toalha". O sistema entrega.
    // Se o hóspede tem fichas, o sistema "cobra" uma ficha (ficha -> toalha).
    if (item === 'towels' && delta > 0) {
      await handleAdjust(aptNumber, item, delta, currentValue);
      
      if (data.chips > 0) {
        const chipsToRemove = Math.min(delta, data.chips);
        await handleAdjust(aptNumber, 'chips', -chipsToRemove, data.chips);
        showToast(`🧺 ${delta} toalha(s) entregue(s) - ${chipsToRemove} ficha(s) usada(s)`, 'info');
      } else {
        showToast(`🧺 ${delta} toalha(s) entregue(s) (sem ficha/troca)`, 'info');
      }
      return;
    }
    
    // 2. Devolução de Toalha (-)
    // O operador clica em "- Toalha". O hóspede devolve, e ganha ficha de volta.
    if (item === 'towels' && delta < 0) {
      await handleAdjust(aptNumber, item, delta, currentValue);
      await handleAdjust(aptNumber, 'chips', Math.abs(delta), data.chips);
      showToast(`🎫 ${Math.abs(delta)} ficha(s) devolvida(s)`, 'info');
      return;
    }
    
    // 3. Adição de Ficha (+)
    // O hóspede ganha fichas (check-in). NÃO entrega toalha ainda.
    if (item === 'chips' && delta > 0) {
      await handleAdjust(aptNumber, item, delta, currentValue);
      showToast(`🎫 ${delta} ficha(s) adicionada(s)`, 'info');
      return;
    }
    
    // 4. Remoção de Ficha (-) -> Lógica solicitada
    // O operador clica em "- Ficha". O sistema ENTREGA a toalha automaticamente.
    if (item === 'chips' && delta < 0) {
      const quantity = Math.abs(delta);
      
      // Remove a ficha (torna-se toalha)
      await handleAdjust(aptNumber, item, delta, currentValue);
      
      // Adiciona a toalha correspondente
      await handleAdjust(aptNumber, 'towels', quantity, data.towels);
      
      showToast(`🎫 Ficha removida - 🧺 ${quantity} toalha(s) entregue(s)`, 'info');
      return;
    }
    
    // Outros ajustes genéricos (fallback)
    await handleAdjust(aptNumber, item, delta, currentValue);
    const messages = {
      chips: { up: 'Ficha adicionada', down: 'Ficha retirada' },
      towels: { up: 'Toalha entregue', down: 'Toalha devolvida' }
    };
    const action = delta > 0 ? 'up' : 'down';
    showToast(`${messages[item][action]}`, 'info');
  };

  // Botão de assinatura - AGORA PERGUNTA QUANTAS TOALHAS
  const handleRequestSignature = () => {
    // Verifica se tem toalhas para registrar
    if (data.towels <= 0) {
      showToast('Não há toalhas para registrar assinatura', 'warning');
      return;
    }
    
    // Pergunta quantas toalhas quer na assinatura
    const quantityStr = prompt(
      `📝 Registrar assinatura para ${data.guest || 'hóspede'} - Apto ${aptNumber}\n` +
      `Toalhas atuais: ${data.towels}\n\n` +
      'Quantas toalhas nesta assinatura?',
      String(data.towels)
    );
    
    if (!quantityStr) return;
    
    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0 || quantity > data.towels) {
      showToast('Quantidade inválida', 'error');
      return;
    }
    
    // Define operação baseado se tem fichas ou não
    const operation = data.chips > 0 ? 'chips_to_towels' : 'towel_exchange';
    setPendingTowelData({ operation, quantity });
    setShowTowelModal(true);
  };

  // Handler quando a assinatura é concluída
  const handleTowelSignatureSuccess = () => {
    setShowTowelModal(false);
    setPendingTowelData(null);
    showToast('✅ Assinatura registrada com sucesso!', 'success');
    onSuccess?.();
  };

  // Bloco e exibição de itens
  const blockAndItems = (
    <div className="flex items-center gap-1 mb-2">
      <div className="text-xs text-gray-500 dark:text-gray-400">{data.block}</div>
      {data.occupied && (
        <div className="flex gap-1 ml-auto">
          {data.towels > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded-full font-medium">
              🧺 {data.towels}
            </span>
          )}
          {data.chips > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-medium">
              🎫 {data.chips}
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
          <>
            <ApartmentItemsControl
              chips={data.chips}
              towels={data.towels}
              loading={loading}
              onAdjust={onAdjustItem}
            />
            
            {/* Botão independente para assinatura */}
            <button
              onClick={handleRequestSignature}
              disabled={loading || data.towels <= 0}
              className="w-full mt-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-200 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              ✍️ Registrar assinatura digital
            </button>
          </>
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

      {/* Modais existentes */}
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

      {/* Modal de assinatura de toalha */}
      {pendingTowelData && (
        <TowelSignatureModal
          isOpen={showTowelModal}
          aptNumber={aptNumber}
          guestName={data.guest || ''}
          operation={pendingTowelData.operation}
          quantity={pendingTowelData.quantity}
          onClose={() => {
            setShowTowelModal(false);
            setPendingTowelData(null);
          }}
          onSuccess={handleTowelSignatureSuccess}
        />
      )}
    </>
  );
}