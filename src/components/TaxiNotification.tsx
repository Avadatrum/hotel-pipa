// src/components/TaxiNotification.tsx

import { useEffect, useState, useCallback } from 'react';
import { listenTaxiRequests, attendTaxiRequest, getPendingTaxiRequests, type TaxiRequest } from '../services/taxiService';
import { playNotificationSound, playUrgentSound } from '../utils/soundPlayer';
import { useAuth } from '../contexts/AuthContext';

export function TaxiNotification() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TaxiRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TaxiRequest | null>(null);
  const [attendedSet, setAttendedSet] = useState<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Busca chamadas pendentes que já existiam antes
    getPendingTaxiRequests().then(pending => {
      if (pending.length > 0) {
        setRequests(pending);
        
        const latest = pending[0];
        if (!attendedSet.has(latest.id!)) {
          setCurrentRequest(latest);
          setShowModal(true);
          
          if (audioEnabled) {
            playNotificationSound();
            const interval = setInterval(() => {
              if (audioEnabled) playUrgentSound();
            }, 15000);
            setTimeout(() => clearInterval(interval), 60000);
          }
        }
      }
    }).catch(err => {
      console.error(`❌ Erro ao buscar chamadas pendentes: ${err}`);
    });

    // Escuta novas chamadas em tempo real
    const unsubscribe = listenTaxiRequests((newRequest) => {
      console.log(`🚕 Nova solicitação de táxi recebida: ${newRequest.aptNumber} - ${newRequest.guestName}`);
      
      setRequests(prev => {
        if (prev.some(r => r.id === newRequest.id)) return prev;
        return [newRequest, ...prev];
      });

      if (!attendedSet.has(newRequest.id!)) {
        setCurrentRequest(newRequest);
        setShowModal(true);
        
        if (audioEnabled) {
          playNotificationSound();
          const interval = setInterval(() => {
            if (audioEnabled) playUrgentSound();
          }, 15000);
          setTimeout(() => clearInterval(interval), 60000);
        }
      }
    });

    return () => unsubscribe();
  }, [user, attendedSet, audioEnabled]);

  const handleAttend = useCallback(async () => {
    if (!currentRequest?.id || !user) return;
    
    try {
      await attendTaxiRequest(currentRequest.id, user.name);
      
      setAttendedSet(prev => new Set([...prev, currentRequest.id!]));
      setRequests(prev => 
        prev.map(r => 
          r.id === currentRequest.id 
            ? { ...r, status: 'attended' as const }
            : r
        )
      );
      setShowModal(false);
      setCurrentRequest(null);
    } catch (error) {
      console.error(`❌ Erro ao atender táxi: ${error}`);
    }
  }, [currentRequest, user]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setCurrentRequest(null);
  }, []);

  if (!user) return null;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  console.log(`🚕 TaxiNotification - Pendentes: ${pendingCount}`);

  return (
    <>
      {/* Badge de notificação */}
      {pendingCount > 0 && !showModal && (
        <button
          onClick={() => {
            const pending = requests.find(r => r.status === 'pending');
            if (pending) {
              setCurrentRequest(pending);
              setShowModal(true);
              if (audioEnabled) playNotificationSound();
            }
          }}
          className="fixed bottom-24 right-4 z-50 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 font-bold text-sm"
        >
          <span className="text-xl">🚕</span>
          {pendingCount} {pendingCount === 1 ? 'Táxi pendente' : 'Táxis pendentes'}
        </button>
      )}

      {/* Modal de alerta */}
      {showModal && currentRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-slide-up border-2 border-yellow-400">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🚕</div>
              <h2 className="text-xl font-extrabold text-stone-800">Solicitação de Táxi!</h2>
              <p className="text-sm text-stone-500 mt-1">Toque para atender</p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border border-yellow-200">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-yellow-700 uppercase font-bold">Hóspede</p>
                  <p className="text-lg font-bold text-stone-800">{currentRequest.guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-yellow-700 uppercase font-bold">Apartamento</p>
                  <p className="text-lg font-bold text-stone-800">{currentRequest.aptNumber}</p>
                </div>
                {currentRequest.phone && (
                  <div>
                    <p className="text-xs text-yellow-700 uppercase font-bold">WhatsApp</p>
                    <a
                      href={`https://wa.me/${currentRequest.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 font-bold hover:underline"
                    >
                      {currentRequest.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`text-xs font-bold ${audioEnabled ? 'text-stone-600' : 'text-red-500'}`}
              >
                {audioEnabled ? '🔊 Som ligado' : '🔇 Som desligado'}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAttend}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors active:scale-95"
              >
                ✅ Atender
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-stone-200 text-stone-700 rounded-2xl font-bold hover:bg-stone-300 transition-colors active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}