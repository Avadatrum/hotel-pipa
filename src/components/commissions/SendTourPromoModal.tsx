// src/components/commissions/SendTourPromoModal.tsx
import { useState } from 'react';
import type { Tour } from '../../types/commission.types';
import { communicationTourService } from '../../services/communicationTourService';

interface Props {
  tour: Tour | null;
  onClose: () => void;
}

export function SendTourPromoModal({ tour, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [modo, setModo] = useState<'numero' | 'apartamento'>('numero');
  const [sendMode, setSendMode] = useState<'text' | 'photos' | 'both'>('both'); // 🆕

  if (!tour) return null;

  const previewMsg = communicationTourService.generateTourPromo(tour);
  const hasPhotos = tour.fotos && tour.fotos.length > 0;

  const handleSend = () => {
    const destino = modo === 'numero' ? phone : apartamento;
    if (!destino.trim()) return;
    
    // 🆕 Remove qualquer formatação, mantém apenas números
    const cleanPhone = destino.replace(/\D/g, '');
    
    if (sendMode === 'text') {
      communicationTourService.sendTourPromo(tour, cleanPhone);
    } else if (sendMode === 'photos' && hasPhotos) {
      communicationTourService.sendTourPhotos(tour, cleanPhone);
    } else {
      communicationTourService.sendTourWithPhotos(tour, cleanPhone);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
        <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Enviar para cliente</h3>
            <p className="text-xs text-gray-500 mt-0.5">{tour.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview da mensagem */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Prévia da mensagem</p>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">{previewMsg}</pre>
          </div>

          {/* 🆕 Modo de envio (se tiver fotos) */}
          {hasPhotos && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                O que enviar?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSendMode('text')}
                  className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                    sendMode === 'text' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  📝 Texto
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('photos')}
                  className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                    sendMode === 'photos' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  🖼️ Fotos
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('both')}
                  className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                    sendMode === 'both' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  ✨ Ambos
                </button>
              </div>
            </div>
          )}

          {/* Destino */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Enviar para</label>
            <div className="flex gap-2 mb-3">
              {(['numero', 'apartamento'] as const).map(m => (
                <button key={m} onClick={() => setModo(m)}
                  className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${modo === m ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {m === 'numero' ? 'Número' : 'Apartamento'}
                </button>
              ))}
            </div>
            {modo === 'numero' ? (
              <div>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex: 84999999999 (sem +55)"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" 
                  autoFocus 
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Digite o número completo com DDD. Não adicionamos +55 automaticamente.
                </p>
              </div>
            ) : (
              <input 
                type="text" 
                value={apartamento} 
                onChange={e => setApartamento(e.target.value)}
                placeholder="Número do apartamento"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" 
                autoFocus 
              />
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSend} 
            disabled={!(modo === 'numero' ? phone.trim() : apartamento.trim())}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}