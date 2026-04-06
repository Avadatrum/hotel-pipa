// components/apartment/CheckinModal.tsx
import { useState } from 'react';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

interface CheckinModalProps {
  isOpen: boolean;
  aptNumber: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: { guestName: string; pax: number; phone: string; countryCode: string }) => void;
}

export function CheckinModal({ isOpen, aptNumber, loading, onClose, onConfirm }: CheckinModalProps) {
  const [guestName, setGuestName] = useState('');
  const [pax, setPax] = useState(1);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!guestName.trim()) return;
    // REMOVEMOS a validação do telefone
    // Agora aceita qualquer telefone ou vazio
    onConfirm({ guestName, pax, phone, countryCode });
  };

  const handleClose = () => {
    setGuestName('');
    setPax(1);
    setPhone('');
    setCountryCode('+55');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
          Check-in Apto {aptNumber}
        </h2>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Nome do hóspede *
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Digite o nome"
            autoFocus
          />
        </div>
        
        <div className="mb-3">
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
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Número de hóspedes
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setPax(num)}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  pax === num 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !guestName.trim()}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Processando...' : 'Confirmar Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
}