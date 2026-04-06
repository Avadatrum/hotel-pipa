// components/apartment/CheckoutModal.tsx
import { useState } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  aptNumber: number;
  guest?: string;
  phone?: string;
  chips: number;
  towels: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (lostTowels: number) => void;
}

export function CheckoutModal({ 
  isOpen, 
  aptNumber, 
  guest, 
  phone, 
  chips, 
  towels, 
  loading, 
  onClose, 
  onConfirm 
}: CheckoutModalProps) {
  const [lostTowels, setLostTowels] = useState(0);

  if (!isOpen) return null;

  const handleClose = () => {
    setLostTowels(0);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(lostTowels);
    setLostTowels(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
          Check-out Apto {aptNumber}
        </h2>
        
        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hóspede: <strong className="dark:text-white">{guest}</strong>
          </p>
          {phone && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Telefone: <strong className="dark:text-white">{phone}</strong>
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Fichas restantes: <strong className="dark:text-white">{chips}</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Toalhas com hóspede: <strong className="dark:text-white">{towels}</strong>
          </p>
          
          <label className="block text-sm font-medium mt-3 mb-1 text-gray-700 dark:text-gray-300">
            Toalhas não devolvidas (perdas):
          </label>
          <input
            type="number"
            value={lostTowels}
            onChange={(e) => setLostTowels(Math.min(Math.max(0, parseInt(e.target.value) || 0), towels))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            min="0"
            max={towels}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Máximo: {towels} toalhas
          </p>
        </div>
        
        {lostTowels > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              Serão registradas {lostTowels} toalha(s) como PERDA.
            </p>
          </div>
        )}
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}