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
    if (!loading && !error && !success) {
      setupCanvas();
    }
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvasRef.current) resizeObserver.observe(canvasRef.current.parentElement!);

    return () => resizeObserver.disconnect();
  }, [loading, error, success]);

  const loadToken = async () => {
    if (!aptNumber || !token) {
      setError('Link de acesso inválido ou incompleto.');
      setLoading(false);
      return;
    }

    try {
      const data = await validateToken(parseInt(aptNumber), token);
      if (!data) {
        setError('Este QR Code já foi utilizado ou expirou.');
        setLoading(false);
        return;
      }
      setSignatureData(data);
    } catch (err: any) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
        setupCanvas();
        return;
    }
    // Salva o conteúdo atual antes de redimensionar para não perder a assinatura
    const tempImage = canvas.toDataURL();
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const img = new Image();
    img.src = tempImage;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Garante que o estilo da linha se mantenha
      if (ctx) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    };
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    setupCanvas();
    setHasSignature(false);
  };

  const handleSave = async () => {
    if (!hasSignature || !aptNumber || !token || saving) return;
    setSaving(true);
    setSaveError('');
    
    try {
      const signatureBase64 = canvasRef.current?.toDataURL('image/png');
      const result = await saveSignature(parseInt(aptNumber), token, signatureBase64!);
      
      if (result.success) setSuccess(true);
      else setSaveError(result.error || 'Erro ao processar assinatura.');
    } catch (err: any) {
      setSaveError('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDERS ---

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-600 font-medium animate-pulse">Elevando sua experiência...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-100">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
        <p className="text-slate-500 mb-6 leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-all">
          Tentar Novamente
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Confirmado!</h2>
        <p className="text-slate-500 mb-6">Sua assinatura foi registrada com sucesso.</p>
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hóspede</p>
          <p className="text-slate-700 font-semibold">{signatureData?.guestName}</p>
          <p className="text-slate-500 text-sm">Apartamento {signatureData?.aptNumber}</p>
        </div>
        <p className="text-xs text-slate-400">Você já pode fechar esta aba com segurança.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header com Logo */}
      <div className="bg-white px-6 pt-8 pb-6 text-center shadow-sm">
        <img 
          src="https://i.imgur.com/A4vP7cE.png" 
          alt="Hotel Logo" 
          className="h-16 mx-auto mb-4 object-contain"
        />
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Registro de Toalhas</h1>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Info Card */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-5 text-white mb-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-xs uppercase font-bold">Hóspede</p>
                <h2 className="text-xl font-bold">{signatureData?.guestName}</h2>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                <span className="text-sm font-bold font-mono">APT {signatureData?.aptNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-black/10 rounded-xl p-3 border border-white/10">
              <span className="text-2xl">
                {signatureData?.operation === 'chips_to_towels' ? '🧺' : '🔄'}
              </span>
              <div>
                <p className="text-xs text-blue-100 leading-none mb-1">Operação</p>
                <p className="font-bold">
                   {signatureData?.operation === 'chips_to_towels' ? 'Retirada' : 'Troca'} de {signatureData?.quantity} unidades
                </p>
              </div>
            </div>
          </div>
          {/* Círculo decorativo ao fundo */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full"></div>
        </div>

        {/* Canvas Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="animate-pulse">✍️</span> Assine no campo abaixo
            </span>
            {hasSignature && (
              <button onClick={clearCanvas} className="text-xs font-bold text-red-500 uppercase tracking-wider hover:text-red-700 transition-colors">
                Limpar
              </button>
            )}
          </div>
          
          <div className="relative bg-slate-50 h-64">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                <p className="text-slate-400 text-sm">Use o dedo ou caneta touch</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/50">
            <button
              onClick={handleSave}
              disabled={!hasSignature || saving}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                ${!hasSignature || saving 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'}`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                'Confirmar Entrega'
              )}
            </button>
            {saveError && (
              <p className="text-red-500 text-xs text-center mt-3 font-medium">{saveError}</p>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-6 uppercase tracking-widest">
           • Hotel da Pipa - Controle de Toalhas
        </p>
      </div>
    </div>
  );
}