// src/components/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

// ─── Tela de loading Admin ────────────────────────────────────────────────────

function AdminLoadingScreen() {
  return (
    <div
      className="
        min-h-screen w-full flex items-center justify-center
        bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900
        overflow-hidden relative
      "
      role="status"
      aria-label="Verificando permissões de administrador"
    >
      {/* ── Grade de fundo ───────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      {/* ── Brilho radial roxo ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(139,92,246,0.22) 0%, transparent 70%)',
        }}
      />

      {/* ── Brilho de canto superior esquerdo ────────────────────────────── */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,1) 0%, transparent 70%)' }}
      />

      {/* ── Brilho de canto inferior direito ─────────────────────────────── */}
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,1) 0%, transparent 70%)' }}
      />

      {/* ── Partículas flutuantes ────────────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-0"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            top: p.top,
            left: p.left,
            right: p.right,
            animation: `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* ── Linhas de scan horizontais ───────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)',
            animation: 'scan 4s linear infinite',
          }}
        />
      </div>

      {/* ── Conteúdo central ────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center gap-10"
        style={{ animation: 'fadein 0.5s ease both' }}
      >
        {/* Escudo com anéis */}
        <div className="relative flex items-center justify-center">
          {/* Anéis de pulso */}
          <div
            className="absolute rounded-full border border-violet-500/30"
            style={{ width: 118, height: 118, animation: 'ring-ping 2.4s ease-out infinite' }}
          />
          <div
            className="absolute rounded-full border border-violet-400/15"
            style={{ width: 150, height: 150, animation: 'ring-ping 2.4s ease-out 0.5s infinite' }}
          />
          <div
            className="absolute rounded-full border border-violet-300/08"
            style={{ width: 182, height: 182, animation: 'ring-ping 2.4s ease-out 1s infinite' }}
          />

          {/* Anel estático decorativo */}
          <div
            className="absolute rounded-full border border-violet-500/20"
            style={{ width: 98, height: 98 }}
          />

          {/* Caixa do escudo */}
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #7c3aed, #4c1d95)',
              animation: 'logo-pulse 3s ease-in-out infinite',
            }}
          >
            {/* Reflexo */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)' }}
            />
            {/* Ícone de escudo SVG */}
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 relative"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2L3 6.5V12c0 4.97 3.76 9.16 9 10 5.24-.84 9-5.03 9-10V6.5L12 2Z"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Textos */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="text-white font-bold text-2xl tracking-tight"
              style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
            >
              H<span className="text-violet-400">Panel</span>
            </span>
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full"
              style={{
                background: 'rgba(139,92,246,0.2)',
                color: '#c4b5fd',
                border: '1px solid rgba(139,92,246,0.35)',
              }}
            >
              Admin
            </span>
          </div>

          {/* Barra shimmer roxa */}
          <div
            className="rounded-full overflow-hidden"
            style={{ width: 192, height: 2, background: 'rgba(109,40,217,0.35)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
          </div>

          {/* Texto de status com pontinhos animados */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{ animation: 'dot-pulse 1.4s ease-in-out 0s infinite' }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{ animation: 'dot-pulse 1.4s ease-in-out 0.2s infinite' }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{ animation: 'dot-pulse 1.4s ease-in-out 0.4s infinite' }}
            />
            <span
              className="ml-1 text-slate-400 text-sm font-medium tracking-wide"
              style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
            >
              Autenticando permissões
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-2 opacity-20">
          <div className="w-8 h-px bg-violet-400" />
          <div className="w-1 h-1 rounded-full bg-violet-400" />
          <div className="w-8 h-px bg-violet-400" />
        </div>
      </div>

      {/* ── Keyframes ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes ring-ping {
          0%   { transform: scale(1); opacity: .6; }
          80%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 28px rgba(124,58,237,0.5); }
          50%       { box-shadow: 0 0 52px rgba(139,92,246,0.75); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-a {
          0%, 100% { transform: translateY(0) translateX(0); opacity: .35; }
          33%       { transform: translateY(-16px) translateX(7px); opacity: .75; }
          66%       { transform: translateY(-6px) translateX(-5px); opacity: .45; }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0) translateX(0); opacity: .25; }
          40%       { transform: translateY(13px) translateX(-9px); opacity: .65; }
          70%       { transform: translateY(5px) translateX(7px); opacity: .35; }
        }
        @keyframes scan {
          0%   { top: -4px; opacity: 0; }
          10%  { opacity: .3; }
          90%  { opacity: .2; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50%       { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─── Dados das partículas ─────────────────────────────────────────────────────

const PARTICLES = [
  { size: '6px', color: '#a78bfa', top: '16%', left: '11%', right: undefined, anim: 'float-a', duration: 6, delay: 0 },
  { size: '4px', color: '#c4b5fd', top: '74%', left: '7%',  right: undefined, anim: 'float-b', duration: 8, delay: 1 },
  { size: '8px', color: '#7c3aed', top: '33%', left: undefined, right: '13%', anim: 'float-a', duration: 7, delay: 2 },
  { size: '4px', color: '#818cf8', top: '82%', left: undefined, right: '17%', anim: 'float-b', duration: 5, delay: 0.5 },
  { size: '5px', color: '#ddd6fe', top: '53%', left: '19%', right: undefined, anim: 'float-a', duration: 9, delay: 3 },
  { size: '4px', color: '#a78bfa', top: '20%', left: undefined, right: '21%', anim: 'float-b', duration: 6.5, delay: 1.5 },
  { size: '6px', color: '#8b5cf6', top: '60%', left: undefined, right: '9%',  anim: 'float-a', duration: 7.5, delay: 0.8 },
  { size: '3px', color: '#ede9fe', top: '26%', left: '27%', right: undefined, anim: 'float-b', duration: 5.5, delay: 2.2 },
] as const;

// ─── AdminRoute ───────────────────────────────────────────────────────────────

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <AdminLoadingScreen />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}