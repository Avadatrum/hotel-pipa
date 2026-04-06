// components/apartment/EditPhoneModal.tsx
import { useState, useEffect } from 'react';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

interface EditPhoneModalProps {
  isOpen: boolean;
  aptNumber: number;
  guest?: string;
  currentPhone?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (phone: string, countryCode: string) => void;
}

export function EditPhoneModal({ 
  isOpen, 
  aptNumber, 
  guest, 
  currentPhone, 
  loading, 
  onClose, 
  onConfirm 
}: EditPhoneModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');

  // Inicializa com o telefone atual quando o modal abre
  useEffect(() => {
    if (currentPhone && isOpen) {
      const parts = currentPhone.split(' ');
      if (parts.length >= 2) {
        setCountryCode(parts[0]);
        setPhone(parts.slice(1).join(' '));
      } else {
        setCountryCode('+55');
        setPhone(currentPhone);
      }
    }
  }, [currentPhone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // REMOVEMOS a validação de número mínimo
    // Agora aceita qualquer número, inclusive vazio
    onConfirm(phone, countryCode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
          Editar Telefone - Apto {aptNumber}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Hóspede: <strong>{guest}</strong>
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telefone (WhatsApp)
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">opcional</span>
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              placeholder="+55"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Telefone (opcional)"
            />
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Digite o código do país e o número (pode deixar em branco)
          </p>
        </div>
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}