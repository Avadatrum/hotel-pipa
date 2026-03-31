// src/components/ApartmentCard.tsx
import { useState } from 'react';
import type { Apartment } from '../types';
import { useApartmentActions } from '../hooks/useApartmentActions';

interface ApartmentCardProps {
  aptNumber: number;
  data: Apartment;
  onSuccess?: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ApartmentCard({ aptNumber, data, onSuccess, showToast }: ApartmentCardProps) {
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [pax, setPax] = useState(1);
  const [lostTowels, setLostTowels] = useState(0);
  
  const { loading, handleCheckin, handleCheckout, handleAdjust } = useApartmentActions();

  const onCheckin = async () => {
    if (!guestName.trim()) {
      showToast('Digite o nome do hóspede', 'warning');
      return;
    }
    
    const result = await handleCheckin(aptNumber, guestName, pax);
    if (result.success) {
      showToast(`✅ Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
      setShowCheckinModal(false);
      setGuestName('');
      setPax(1);
      onSuccess?.();
    } else {
      showToast(`❌ Erro no check-in: ${result.error}`, 'error');
    }
  };

  const onCheckout = async () => {
    const result = await handleCheckout(aptNumber, lostTowels);
    if (result.success) {
      if (lostTowels > 0) {
        showToast(`⚠️ Check-out realizado! ${lostTowels} toalha(s) registrada(s) como perda`, 'warning');
      } else {
        showToast(`✅ Check-out realizado! Apto ${aptNumber} liberado`, 'success');
      }
      setShowCheckoutModal(false);
      setLostTowels(0);
      onSuccess?.();
    } else {
      const errorMsg = 'error' in result ? result.error : 'Erro desconhecido';
      showToast(`❌ Erro no check-out: ${errorMsg}`, 'error');
    }
  };

  const onAdjust = async (item: 'chips' | 'towels', delta: number) => {
    const currentValue = item === 'chips' ? data.chips : data.towels;
    const newValue = await handleAdjust(aptNumber, item, delta, currentValue);
    
    const messages = {
      chips: { up: '🎫 Ficha adicionada', down: '🎫 Ficha retirada' },
      towels: { up: '🧺 Toalha entregue', down: '🧺 Toalha devolvida' }
    };
    
    const action = delta > 0 ? 'up' : 'down';
    showToast(`${messages[item][action]} - Total: ${newValue}`, 'info');
  };

  return (
    <>
      <div className={`
        border rounded-lg p-3 transition-all hover:shadow-md
        ${data.occupied 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-200 bg-white'
        }
      `}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xl font-bold text-gray-700">
            {aptNumber}
          </span>
          <span className={`
            w-2 h-2 rounded-full
            ${data.occupied ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
          `} />
        </div>
        
        {data.occupied && data.guest && (
          <div className="text-xs text-gray-600 truncate mb-1">
            👤 {data.guest}
          </div>
        )}
        
        {/* Indicadores visuais de toalhas e fichas */}
        <div className="flex items-center gap-1 mb-2">
          <div className="text-xs text-gray-500">
            {data.block}
          </div>
          {data.occupied && (
            <div className="flex gap-1 ml-auto">
              {data.towels > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full" title={`${data.towels} toalha(s)`}>
                  🧺 {data.towels}
                </span>
              )}
              {data.chips > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full" title={`${data.chips} ficha(s)`}>
                  🎫 {data.chips}
                </span>
              )}
            </div>
          )}
        </div>

        {data.occupied && (
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span>🎫 Fichas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAdjust('chips', -1)}
                  disabled={loading || data.chips === 0}
                  className="w-7 h-7 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors text-sm"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center text-base">{data.chips}</span>
                <button
                  onClick={() => onAdjust('chips', 1)}
                  disabled={loading}
                  className="w-7 h-7 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>🧺 Toalhas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAdjust('towels', -1)}
                  disabled={loading || data.towels === 0}
                  className="w-7 h-7 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors text-sm"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center text-base">{data.towels}</span>
                <button
                  onClick={() => onAdjust('towels', 1)}
                  disabled={loading}
                  className="w-7 h-7 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {!data.occupied ? (
          <button
            onClick={() => setShowCheckinModal(true)}
            disabled={loading}
            className="w-full mt-2 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            Check-in
          </button>
        ) : (
          <button
            onClick={() => {
              setLostTowels(data.towels);
              setShowCheckoutModal(true);
            }}
            disabled={loading}
            className="w-full mt-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            Check-out
          </button>
        )}
      </div>

      {/* Modal de Check-in */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3">Check-in Apto {aptNumber}</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Nome do hóspede *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Número de hóspedes</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setPax(num)}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      pax === num 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCheckinModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onCheckin}
                disabled={loading || !guestName.trim()}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3">Check-out Apto {aptNumber}</h2>
            
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                Hóspede: <strong>{data.guest}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Fichas restantes: <strong>{data.chips}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Toalhas com hóspede: <strong>{data.towels}</strong>
              </p>
              
              <label className="block text-sm font-medium mt-3 mb-1">
                Toalhas não devolvidas (perdas):
              </label>
              <input
                type="number"
                value={lostTowels}
                onChange={(e) => setLostTowels(Math.min(Math.max(0, parseInt(e.target.value) || 0), data.towels))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max={data.towels}
              />
              <p className="text-xs text-gray-500">
                Máximo: {data.towels} toalhas
              </p>
            </div>
            
            {lostTowels > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ Serão registradas {lostTowels} toalha(s) como PERDA.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onCheckout}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}