// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ─── Partícula flutuante ──────────────────────────────────────────────────────

interface FloatingDotProps {
  style: React.CSSProperties;
  className?: string;
}

function FloatingDot({ style, className = '' }: FloatingDotProps) {
  return (
    <div
      className={`absolute rounded-full opacity-0 ${className}`}
      style={style}
    />
  );
}

// ─── Tela de loading ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="
        min-h-screen w-full flex items-center justify-center
        bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900
        overflow-hidden relative
      "
      role="status"
      aria-label="Carregando o sistema"
    >
      {/* ── Fundo: grade sutil ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Fundo: brilho radial central ────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.25) 0%, transparent 70%)',
        }}
      />

      {/* ── Partículas flutuantes ────────────────────────────────────────── */}
      <FloatingDot
        className="w-1.5 h-1.5 bg-blue-400 animate-[float-a_6s_ease-in-out_infinite]"
        style={{ top: '18%', left: '12%' }}
      />
      <FloatingDot
        className="w-1 h-1 bg-sky-300 animate-[float-b_8s_ease-in-out_1s_infinite]"
        style={{ top: '72%', left: '8%' }}
      />
      <FloatingDot
        className="w-2 h-2 bg-blue-500 animate-[float-a_7s_ease-in-out_2s_infinite]"
        style={{ top: '35%', right: '14%' }}
      />
      <FloatingDot
        className="w-1 h-1 bg-indigo-400 animate-[float-b_5s_ease-in-out_0.5s_infinite]"
        style={{ top: '80%', right: '18%' }}
      />
      <FloatingDot
        className="w-1.5 h-1.5 bg-cyan-400 animate-[float-a_9s_ease-in-out_3s_infinite]"
        style={{ top: '55%', left: '20%' }}
      />
      <FloatingDot
        className="w-1 h-1 bg-blue-300 animate-[float-b_6.5s_ease-in-out_1.5s_infinite]"
        style={{ top: '22%', right: '22%' }}
      />

      {/* ── Conteúdo central ────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* Logo com anel de pulso */}
        <div className="relative flex items-center justify-center">
          {/* Anéis de pulso */}
          <div className="absolute w-28 h-28 rounded-full border border-blue-500/30 animate-[ping_2s_ease-out_infinite]" />
          <div className="absolute w-36 h-36 rounded-full border border-blue-400/15 animate-[ping_2s_ease-out_0.4s_infinite]" />
          <div className="absolute w-44 h-44 rounded-full border border-blue-300/10 animate-[ping_2s_ease-out_0.8s_infinite]" />

          {/* Círculo do logo */}
          <div
            className="
              relative w-20 h-20 rounded-2xl flex items-center justify-center
              bg-gradient-to-br from-blue-500 to-blue-700
              shadow-[0_0_40px_rgba(59,130,246,0.5)]
              animate-[pulse_3s_ease-in-out_infinite]
            "
          >
            {/* Reflexo interno */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/10" />

            {/* Letras do logo */}
            <span className="relative text-white font-black text-3xl tracking-tighter select-none">
              H<span className="text-blue-200">P</span>
            </span>
          </div>
        </div>

        {/* Texto + spinner */}
        <div className="flex flex-col items-center gap-5">
          {/* Nome do sistema */}
          <div className="flex items-center gap-2.5">
            <span className="text-white font-bold text-2xl tracking-tight">
              H<span className="text-blue-400">Panel</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
              v1.0.1
            </span>
          </div>

          {/* Barra de progresso indeterminada */}
          <div className="w-48 h-0.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 rounded-full animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>

          {/* Texto de status */}
          <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">
            Verificando acesso…
          </p>
        </div>

        {/* Separador decorativo */}
        <div className="flex items-center gap-2 opacity-30">
          <div className="w-8 h-px bg-slate-500" />
          <div className="w-1 h-1 rounded-full bg-slate-500" />
          <div className="w-8 h-px bg-slate-500" />
        </div>
      </div>

      {/* ── Keyframes injetados ──────────────────────────────────────────── */}
      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          33%       { transform: translateY(-18px) translateX(8px); opacity: 0.8; }
          66%       { transform: translateY(-8px) translateX(-6px); opacity: 0.5; }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          40%       { transform: translateY(14px) translateX(-10px); opacity: 0.7; }
          70%       { transform: translateY(6px) translateX(8px); opacity: 0.4; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}