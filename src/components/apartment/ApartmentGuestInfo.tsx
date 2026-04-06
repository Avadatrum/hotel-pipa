// components/apartment/ApartmentGuestInfo.tsx
import { startWhatsAppConversation } from '../../utils/whatsappMessages';

interface ApartmentGuestInfoProps {
  guest?: string;
  phone?: string;
}

export function ApartmentGuestInfo({ guest, phone }: ApartmentGuestInfoProps) {
  const handlePhoneClick = () => {
    if (phone) {
      startWhatsAppConversation(phone);
    }
  };

  return (
    <>
      {guest && (
        <div className="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">
          {guest}
        </div>
      )}
      
      {/* Botão WhatsApp SEMPRE disponível se houver telefone, mesmo que seja curto */}
      {phone && (
        <button
          onClick={handlePhoneClick}
          className="text-xs text-green-600 dark:text-green-400 truncate mb-1 flex items-center gap-1 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          title="Clique para conversar no WhatsApp"
        >
          📱 {phone}
        </button>
      )}
    </>
  );
}