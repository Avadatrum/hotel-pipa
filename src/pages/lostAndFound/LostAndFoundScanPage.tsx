// src/pages/lostAndFound/LostAndFoundScanPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export const LostAndFoundScanPage: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);
  const navigateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🆕 Função segura para navegar após parar o scanner
  const safeNavigate = (code: string) => {
    console.log('🚀 Preparando navegação segura para:', code);
    
    // Limpa qualquer timeout existente
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
    }
    
    // Pequeno delay para garantir que o scanner foi completamente parado
    navigateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('✅ Navegando para:', `/achados-e-perdidos?code=${code}`);
        navigate(`/achados-e-perdidos?code=${code}`);
      }
    }, 100);
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    const initScanner = async () => {
      try {
        // Verifica se já existe uma instância e limpa
        if (scannerRef.current) {
          try {
            await scannerRef.current.clear();
          } catch (e) {
            // Ignora erro de clear
          }
        }

        // Cria uma nova instância
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        await scanner.start(
          { facingMode: currentFacingMode },
          config,
          async (decodedText: string) => {
            // 🎯 VERIFICA SE JÁ ESTÁ PARANDO
            if (isStoppingRef.current || !isMountedRef.current) {
              console.log('⏹️ Scanner já está parando, ignorando leitura');
              return;
            }

            console.log('═══════════════════════════════');
            console.log('✅ QR Code lido:', decodedText);
            
            // Marca que está parando para evitar múltiplas chamadas
            isStoppingRef.current = true;
            
            // 🎯 PARA O SCANNER DE FORMA SEGURA E AGUARDA
            if (scannerRef.current && isMountedRef.current) {
              try {
                const state = scannerRef.current.getState();
                console.log('📊 Estado do scanner antes de parar:', state);
                
                if (state === Html5QrcodeScannerState.SCANNING) {
                  console.log('🛑 Parando scanner...');
                  await scannerRef.current.stop();
                  console.log('✅ Scanner parado com sucesso');
                  
                  // Aguarda um pouco mais para garantir
                  await new Promise(resolve => setTimeout(resolve, 50));
                  
                  console.log('🧹 Limpando scanner...');
                  await scannerRef.current.clear();
                  console.log('✅ Scanner limpo');
                } else {
                  console.log('⚠️ Scanner não estava em SCANNING, estado:', state);
                }
              } catch (error) {
                console.warn('⚠️ Erro ao parar scanner:', error);
                // Mesmo com erro, tenta navegar
              }
            }
            
            // 🆕 Navega usando a função segura
            safeNavigate(decodedText);
            console.log('═══════════════════════════════');
          },
          (errorMessage: string) => {
            // Ignora erros normais durante o scanning
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('⚠️ Erro no scanner:', errorMessage);
            }
          }
        );
        
        if (isMountedRef.current) {
          setIsScanning(true);
          setHasError(null);
        }
      } catch (err) {
        console.error('❌ Erro ao iniciar scanner:', err);
        if (isMountedRef.current) {
          setIsScanning(false);
          setHasError('Não foi possível acessar a câmera. Verifique as permissões.');
        }
      }
    };

    // Pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initScanner();
      }
    }, 100);

    // 🎯 CLEANUP CORRIGIDO - NÃO FAZ NADA SE JÁ ESTIVER PARANDO
    return () => {
      console.log('🧹 Cleanup do componente');
      isMountedRef.current = false;
      clearTimeout(timer);
      
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
      
      // 🆕 NÃO tenta parar o scanner se já foi parado
      if (!isStoppingRef.current && scannerRef.current) {
        isStoppingRef.current = true;
        
        scannerRef.current.stop()
          .then(() => scannerRef.current?.clear())
          .catch((err) => {
            // Ignora erros no cleanup
            if (err && !err.message?.includes('not running')) {
              console.warn('⚠️ Erro no cleanup do scanner:', err);
            }
          })
          .finally(() => {
            scannerRef.current = null;
          });
      } else {
        console.log('⏭️ Scanner já estava parado, pulando cleanup');
        scannerRef.current = null;
      }
    };
  }, [navigate, currentFacingMode]);

  // 🆕 Função segura para trocar câmera
  const handleSwitchCamera = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 1) {
        isStoppingRef.current = true;
        
        const currentState = scannerRef.current.getState();
        if (currentState === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        }
        
        // Alterna entre as câmeras
        const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        setCurrentFacingMode(newFacingMode);
        
        // Reinicia o scanner
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };
        
        await scanner.start(
          { facingMode: newFacingMode },
          config,
          async (decodedText: string) => {
            if (isStoppingRef.current || !isMountedRef.current) return;
            
            isStoppingRef.current = true;
            console.log('✅ QR Code lido:', decodedText);
            
            try {
              if (scannerRef.current) {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                  await scannerRef.current.stop();
                  await scannerRef.current.clear();
                }
              }
            } catch (error) {
              console.warn('Erro ao parar scanner:', error);
            }
            
            safeNavigate(decodedText);
          },
          (errorMessage: string) => {
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('Erro no scanner:', errorMessage);
            }
          }
        );
        
        isStoppingRef.current = false;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Erro ao trocar câmera:', err);
      isStoppingRef.current = false;
      setHasError('Erro ao trocar câmera. Tente novamente.');
    }
  };

  // 🆕 Função para entrada manual
  const handleManualEntry = () => {
    const code = prompt('Digite o código do item (ex: ACH-24-00001):');
    if (code?.trim()) {
      isStoppingRef.current = true;
      safeNavigate(code.trim());
    }
  };

  // Função para voltar
  const handleGoBack = () => {
    isStoppingRef.current = true;
    navigate('/achados-e-perdidos');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="mb-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            <span>←</span> Voltar para lista
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            📷 Escanear QR Code
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aponte a câmera para o QR Code da etiqueta
          </p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
          {hasError ? (
            <div className="w-full aspect-square flex items-center justify-center p-6 bg-red-50 dark:bg-red-950/20">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">❌ {hasError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              id="qr-reader" 
              className="w-full aspect-square"
              style={{ minHeight: '300px' }}
            />
          )}
        </div>

        {/* Status do Scanner */}
        {!hasError && !isScanning && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              ⚠️ Inicializando câmera...
            </p>
          </div>
        )}

        {/* Badge da câmera atual */}
        {isScanning && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400">
              📷 Câmera {currentFacingMode === 'environment' ? 'Traseira' : 'Frontal'}
            </span>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
          <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
            ℹ️ Como usar:
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Posicione o QR Code no centro da câmera</li>
            <li>• Mantenha o código bem iluminado</li>
            <li>• A leitura é automática</li>
          </ul>
        </div>

        {/* Opções */}
        <div className="mt-4 space-y-2">
          <div className="text-center">
            <button
              onClick={handleManualEntry}
              className="text-sm text-slate-500 dark:text-slate-400 underline"
            >
              Ou digite o código manualmente
            </button>
          </div>

          {/* Botão para trocar câmera */}
          <div className="text-center">
            <button
              onClick={handleSwitchCamera}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isScanning}
            >
              🔄 Trocar câmera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};