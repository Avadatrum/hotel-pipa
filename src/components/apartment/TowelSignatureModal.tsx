// src/components/apartment/TowelSignatureModal.tsx - CORRIGIDO
import { useState, useEffect, useRef } from 'react'; // Importei useRef
import { QRCodeSVG } from 'qrcode.react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { generateTowelToken } from '../../services/towelService';

interface TowelSignatureModalProps {
  isOpen: boolean;
  aptNumber: number;
  guestName: string;
  operation: 'chips_to_towels' | 'towel_exchange';
  quantity: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function TowelSignatureModal({
  isOpen,
  aptNumber,
  guestName,
  operation,
  quantity,
  onClose,
  onSuccess
}: TowelSignatureModalProps) {
  const [token, setToken] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [expiresIn, setExpiresIn] = useState(900);
  
  // SUBSTITUIÇÃO: Usamos useRef para contar verificações sem causar re-render
  const checkCountRef = useRef(0);

  // Timer regressivo
  useEffect(() => {
    if (showQR && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showQR]);

  // Verificar se assinatura foi realizada (polling)
  useEffect(() => {
    if (!token || !showQR) return;

    const checkSignature = async () => {
      try {
        const docRef = doc(db, 'apartments', String(aptNumber), 'towelSignatures', token);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.used && data.signature) {
            onSuccess();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      }
    };

    const interval = setInterval(() => {
      // Usa o ref atual diretamente
      if (checkCountRef.current > 100) {
        clearInterval(interval);
      } else {
        checkSignature();
        // Incrementa o ref
        checkCountRef.current += 1;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, showQR, aptNumber, onSuccess]);

  // Gera QR automaticamente ao abrir
  useEffect(() => {
    if (isOpen) {
      handleGenerateQR();
    }
  }, [isOpen]);

  const handleGenerateQR = async () => {
    setLoading(true);
    checkCountRef.current = 0; // Reseta o contador usando o ref
    try {
      const result = await generateTowelToken(aptNumber, guestName, operation, quantity);
      setToken(result.token);
      setQrUrl(`${window.location.origin}${result.url}`);
      setShowQR(true);
      setExpiresIn(900);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setQrUrl('');
    setShowQR(false);
    setExpiresIn(900);
    checkCountRef.current = 0; // Reseta o contador
    onClose();
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
        {loading && !showQR ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 animate-pulse">🔄</div>
            <p className="text-gray-600 dark:text-gray-400">Gerando QR Code...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-3">
              <span className="text-3xl">🧺</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                Assinatura de Toalhas
              </h2>
            </div>

            {/* Info da operação */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Hóspede:</span> {guestName}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Apto:</span> {aptNumber}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                <span className="font-medium">Operação:</span>{' '}
                {operation === 'chips_to_towels' 
                  ? `Retirada de ${quantity} toalha(s)`
                  : `Troca de ${quantity} toalha(s)`
                }
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg mb-3 flex justify-center border-2 border-gray-200">
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            {/* Timer */}
            <div className="text-center mb-3">
              <span className={`text-sm font-mono font-bold ${
                expiresIn < 60 
                  ? 'text-red-600 animate-pulse' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                ⏱️ {expiresIn > 0 ? formatTime(expiresIn) : 'Expirado'}
              </span>
            </div>

            {/* Instruções */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                📱 O hóspede deve escanear o QR Code e assinar na tela.
                <br />
                ⚠️ Este QR Code expira em 15 minutos.
                <br />
                ✅ O sistema detectará automaticamente quando a assinatura for concluída.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
              >
                🔄 Novo QR
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