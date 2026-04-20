// src/pages/lostAndFound/LostAndFoundScanPage.tsx

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export const LostAndFoundScanPage: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initScanner = async () => {
      try {
        // Cria uma nova instância
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Sucesso na leitura
            console.log('✅ QR Code lido:', decodedText);
            
            // Para o scanner
            if (scannerRef.current && isMounted) {
              scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
              }).catch(console.error);
            }
            
            // Navega para o item
            navigate(`/achados-e-perdidos?code=${decodedText}`);
          },
          (errorMessage) => {
            // Ignora erros normais durante o scanning
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('⚠️ Erro no scanner:', errorMessage);
            }
          }
        );
      } catch (err) {
        console.error('❌ Erro ao iniciar scanner:', err);
      }
    };

    // Pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      if (isMounted) {
        initScanner();
      }
    }, 100);

    // Cleanup - ESSENCIAL para evitar o erro
    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (scannerRef.current) {
        scannerRef.current.stop()
          .then(() => {
            return scannerRef.current?.clear();
          })
          .catch((err) => {
            console.log('Scanner já estava parado:', err);
          })
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/achados-e-perdidos')}
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
          <div 
            ref={containerRef}
            id="qr-reader" 
            className="w-full aspect-square"
            style={{ minHeight: '300px' }}
          />
        </div>

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

        {/* Opção manual */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const code = prompt('Digite o código do item (ex: ACH-24-00001):');
              if (code) {
                navigate(`/achados-e-perdidos?code=${code}`);
              }
            }}
            className="text-sm text-slate-500 dark:text-slate-400 underline"
          >
            Ou digite o código manualmente
          </button>
        </div>

        {/* Botão para trocar câmera */}
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              if (scannerRef.current) {
                try {
                  const cameras = await Html5Qrcode.getCameras();
                  if (cameras && cameras.length > 1) {
                    // Alterna entre câmeras
                    await scannerRef.current.stop();
                    // Implementar lógica de troca de câmera aqui se necessário
                  }
                } catch (err) {
                  console.error('Erro ao trocar câmera:', err);
                }
              }
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            🔄 Trocar câmera
          </button>
        </div>
      </div>
    </div>
  );
};