// src/pages/PublicTowelSignaturePage.tsx
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validateToken, saveSignature } from '../services/towelService';

export function PublicTowelSignaturePage() {
  const { aptNumber, token } = useParams<{ aptNumber: string; token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [signatureData, setSignatureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    loadToken();
  }, [aptNumber, token]);

  useEffect(() => {
    setupCanvas();
  }, []);

  const loadToken = async () => {
    if (!aptNumber || !token) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    try {
      const data = await validateToken(parseInt(aptNumber), token);
      
      if (!data) {
        setError('QR Code inválido ou expirado');
        setLoading(false);
        return;
      }

      setSignatureData(data);
      setLoading(false);
    } catch (err: any) {
      setError('Erro de conexão');
      setLoading(false);
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = async () => {
    if (!hasSignature || !aptNumber || !token || saving) return;

    setSaving(true);
    setSaveError('');
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureBase64 = canvas.toDataURL('image/png');
    
    try {
      const result = await saveSignature(parseInt(aptNumber), token, signatureBase64);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setSaveError(result.error || 'Erro ao salvar');
      }
    } catch (err: any) {
      setSaveError('Erro ao salvar: ' + err.message);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧺</div>
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Ops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-3">
            Assinatura Registrada!
          </h2>
          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <p className="text-green-700 font-medium">{signatureData?.guestName}</p>
            <p className="text-green-600 text-sm mt-1">
              Apartamento {signatureData?.aptNumber}
            </p>
          </div>
          <p className="text-gray-500 text-sm">Obrigado! Pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b">
          <div className="text-center mb-3">
            <span className="text-5xl">🧺</span>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Hotel da Pipa
          </h1>
          <p className="text-center text-gray-500 text-sm mt-1">
            Registro de Toalhas
          </p>
        </div>

        {signatureData && (
          <div className="bg-blue-500 text-white p-5">
            <p className="text-lg font-medium">{signatureData.guestName}</p>
            <p className="text-blue-100 text-sm mt-1">
              Apartamento {signatureData.aptNumber}
            </p>
            <div className="mt-3 bg-blue-400 rounded-lg p-3">
              <p className="text-sm font-medium">
                {signatureData.operation === 'chips_to_towels' 
                  ? `Retirada: ${signatureData.quantity} toalha(s)`
                  : `Troca: ${signatureData.quantity} toalha(s)`
                }
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border-x border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ✍️ Assine no campo abaixo:
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-56 touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Toque aqui para assinar</p>
              </div>
            )}
          </div>
          
          {hasSignature && (
            <button
              onClick={clearCanvas}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              ✕ Limpar
            </button>
          )}
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}

        <div className="bg-white rounded-b-2xl shadow-lg p-5 border-t">
          <button
            onClick={handleSave}
            disabled={!hasSignature || saving}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            {saving ? 'Registrando...' : '✅ Confirmar Assinatura'}
          </button>
        </div>
      </div>
    </div>
  );
}