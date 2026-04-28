// src/components/apartment/TermSignatureModal.tsx
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { generateTermToken } from '../../services/termService';

interface TermSignatureModalProps {
  isOpen: boolean;
  aptNumber: number;
  guestName: string;
  phone?: string;
  countryCode?: string; // 🆕 Adicionar
  pax: number;
  onClose: () => void;
  onSuccess: () => void;
  onSkip: () => void;
}

export function TermSignatureModal({
  isOpen,
  aptNumber,
  guestName,
  phone,
  countryCode = '+55', // 🆕 valor default
  pax,
  onClose,
  onSuccess,
  onSkip,
}: TermSignatureModalProps) {
  const [token, setToken] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [expiresIn, setExpiresIn] = useState(1800);
  const [altPhone, setAltPhone] = useState('');
  const [showAltPhone, setShowAltPhone] = useState(false);
  const [sent, setSent] = useState(false);
  
  const checkCountRef = useRef(0);
  const successCalledRef = useRef(false); // 🔥 NOVA: flag para evitar múltiplas chamadas

  // Timer
  useEffect(() => {
    if (showQR && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showQR]);

  // Polling — CORRIGIDO com flag
  useEffect(() => {
    if (!token || !showQR) return;
    
    // Reseta a flag quando um novo token é gerado
    successCalledRef.current = false;

    const checkSignature = async () => {
      // Se já chamou onSuccess, não verifica mais
      if (successCalledRef.current) return;
      
      try {
        const docRef = doc(db, 'termSignatures', token);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.used && data.signature) {
            successCalledRef.current = true; // 🔥 Marca como chamado
            onSuccess();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura do termo:', error);
      }
    };

    const interval = setInterval(() => {
      if (checkCountRef.current > 600 || successCalledRef.current) {
        clearInterval(interval);
      } else {
        checkSignature();
        checkCountRef.current += 1;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, showQR, onSuccess]);

  // Gerar ao abrir
  useEffect(() => {
    if (isOpen) {
      handleGenerateQR();
    }
  }, [isOpen]);

  const handleGenerateQR = async () => {
    setLoading(true);
    checkCountRef.current = 0;
    successCalledRef.current = false; // Reseta flag
    setSent(false);
    try {
      const fullPhone = phone ? `${countryCode}${phone}` : ''; // 🆕 Junta país + número
      const result = await generateTermToken(aptNumber, guestName, pax, fullPhone);
      setToken(result.token);
      setQrUrl(`${window.location.origin}${result.url}`);
      setShowQR(true);
      setExpiresIn(1800);
    } catch (error) {
      console.error('Erro ao gerar QR code do termo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setQrUrl('');
    setShowQR(false);
    setExpiresIn(1800);
    setAltPhone('');
    setShowAltPhone(false);
    setSent(false);
    successCalledRef.current = false;
    checkCountRef.current = 0;
    onClose();
  };

  // Enviar via WhatsApp
  const handleSendWhatsApp = (targetPhone?: string) => {
    if (!qrUrl) return;

    const msg = `🛎️ *Hotel da Pipa - Termo de Responsabilidade*\n\n` +
      `Olá *${guestName}*!\n\n` +
      `Por favor, assine o termo de responsabilidade das toalhas/fichas:\n` +
      `${qrUrl}\n\n` +
      `⚠️ Este link expira em 30 minutos.\n\n` +
      `Obrigado!`;

    const encoded = encodeURIComponent(msg);
    const phoneToUse = targetPhone || `${countryCode}${phone}` || '';
    const cleanPhone = phoneToUse.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    setSent(true);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up max-h-[90vh] overflow-y-auto">
        {loading && !showQR ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 animate-pulse">📄</div>
            <p className="text-gray-600 dark:text-gray-400">Gerando Termo de Responsabilidade...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-3">
              <span className="text-3xl">📝</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                Termo de Responsabilidade
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                O hóspede deve aceitar os termos das toalhas/fichas
              </p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Hóspede:</span> {guestName}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Apto:</span> {aptNumber}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Hóspedes:</span> {pax}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Fichas:</span> {pax} (1 por hóspede)
              </p>
              <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Termo:</strong> Declaro que recebi as fichas/toalhas e estou ciente
                  que a não devolução implicará no pagamento de <strong>R$ 80,00</strong> por unidade
                  não devolvida no check-out.
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg mb-3 flex justify-center border-2 border-gray-200">
              <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin />
            </div>

            {/* Timer */}
            <div className="text-center mb-3">
              <span className={`text-sm font-mono font-bold ${
                expiresIn < 120 ? 'text-red-600 animate-pulse' : 'text-gray-600 dark:text-gray-400'
              }`}>
                ⏱️ {expiresIn > 0 ? formatTime(expiresIn) : 'Expirado'}
              </span>
            </div>

            {/* WhatsApp */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                📱 Enviar link para o hóspede
              </p>

              {(phone || countryCode !== '+55') && (
                <button
                  onClick={() => handleSendWhatsApp()}
                  disabled={sent}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium mb-2 flex items-center justify-center gap-2"
                >
                  📱 Enviar para {countryCode}{phone}
                  {sent && ' ✓'}
                </button>
              )}

              {!showAltPhone ? (
                <button
                  onClick={() => setShowAltPhone(true)}
                  className="w-full py-1.5 text-xs text-green-600 dark:text-green-400 hover:underline"
                >
                  + Enviar para outro número
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="Número com DDI/DDD..."
                    className="flex-1 border border-green-300 dark:border-green-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => handleSendWhatsApp(altPhone)}
                    disabled={!altPhone.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                📱 O hóspede escaneia o QR Code e assina na tela.
                <br />
                ⚠️ Este QR Code expira em 30 minutos.
                <br />
                ✅ A detecção da assinatura é automática.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
              >
                🔄 Novo QR
              </button>
              <button
                onClick={onSkip}
                className="flex-1 py-2 border border-orange-300 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-orange-700 dark:text-orange-300 text-sm"
              >
                Pular
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}