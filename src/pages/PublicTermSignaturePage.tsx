// src/pages/PublicTermSignaturePage.tsx
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validateTermToken, saveTermSignature } from '../services/termService';

export function PublicTermSignaturePage() {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [termData, setTermData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => { loadToken(); }, [token]);

  useEffect(() => {
    if (!loading && !error && !success) {
      setupCanvas();
    }
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvasRef.current) resizeObserver.observe(canvasRef.current.parentElement!);
    return () => resizeObserver.disconnect();
  }, [loading, error, success]);

  const loadToken = async () => {
    if (!token) {
      setError('Link inválido.');
      setLoading(false);
      return;
    }
    try {
      const data = await validateTermToken(token);
      if (!data) {
        setError('Este termo já foi assinado ou expirou.');
        setLoading(false);
        return;
      }
      setTermData(data);
    } catch {
      setError('Erro de conexão.');
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
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) { setupCanvas(); return; }
    const tempImage = canvas.toDataURL();
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const img = new Image();
    img.src = tempImage;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (ctx) { ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; }
    };
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
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
  const clearCanvas = () => { setupCanvas(); setHasSignature(false); };

  const handleSave = async () => {
    if (!hasSignature || !token || saving || !agreed) return;
    setSaving(true);
    setSaveError('');
    try {
      const signatureBase64 = canvasRef.current?.toDataURL('image/png');
      const result = await saveTermSignature(token, signatureBase64!);
      if (result.success) setSuccess(true);
      else setSaveError(result.error || 'Erro ao processar assinatura.');
    } catch {
      setSaveError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-600 font-medium">Carregando termo...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Indisponível</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold">
          Tentar Novamente
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Termo Assinado!</h2>
        <p className="text-slate-500 mb-6">O termo de responsabilidade foi registrado com sucesso.</p>
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hóspede</p>
          <p className="text-slate-700 font-semibold">{termData?.guestName}</p>
          <p className="text-slate-500 text-sm">Apartamento {termData?.aptNumber}</p>
        </div>
        <p className="text-xs text-slate-400">Você já pode fechar esta aba.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-white px-6 pt-8 pb-6 text-center shadow-sm">
        <img src="https://i.imgur.com/A4vP7cE.png" alt="Hotel Logo" className="h-16 mx-auto mb-4 object-contain" />
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Termo de Responsabilidade</h1>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Termo */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 mb-4">
          <h3 className="font-bold text-slate-800 mb-3">Termo de Uso de Toalhas e Fichas</h3>
          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>Declaro para devidos fins que, na condição de hóspede do apartamento <strong>{termData?.aptNumber}</strong>, recebi a quantidade de <strong>{termData?.pax} ficha(s)</strong> para toalhas de piscina (uma unidade por hóspede/dia).</p>
            <p>Na falta da devolução da mesma, estou ciente que pagarei o valor de <strong>R$ 80,00</strong> por toalha ou ficha não devolvida.</p>
            <p>Por fim, dou ciência da obrigatoriedade da devolução da mesma no ato do check-out.</p>
          </div>

          {/* Checkbox de concordância */}
          <label className="flex items-start gap-3 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-amber-900">
              Li e concordo com os termos acima. Estou ciente das condições de uso e penalidades por não devolução.
            </span>
          </label>
        </div>

        {/* Canvas de assinatura */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">✍️ Sua assinatura</span>
            {hasSignature && (
              <button onClick={clearCanvas} className="text-xs font-bold text-red-500 uppercase">Limpar</button>
            )}
          </div>
          <div className="relative bg-slate-50 h-48">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none"
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <p className="text-slate-400 text-sm">Assine aqui</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/50">
            <button
              onClick={handleSave}
              disabled={!hasSignature || !agreed || saving}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                ${!hasSignature || !agreed || saving
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}`}
            >
              {saving ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Salvando...</>
              ) : (
                'Assinar Termo'
              )}
            </button>
            {saveError && <p className="text-red-500 text-xs text-center mt-3">{saveError}</p>}
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-6 uppercase tracking-widest">Hotel da Pipa • Termo Digital</p>
      </div>
    </div>
  );
}