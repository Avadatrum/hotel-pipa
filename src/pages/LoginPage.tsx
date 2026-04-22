// src/pages/LoginPage.tsx
// ─────────────────────────────────────────────────────────────────
//  HPanel · Hotel da Pipa  —  Login Page
//  Stack: React + TypeScript + Tailwind CSS
//  Fonte: Plus Jakarta Sans (Moderna & Geométrica)
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { auth } from '../services/firebase';
import {
  Waves,
  Umbrella,
  Percent,
  MessageCircle,
  TrendingUp,
  Users,
  ShieldCheck,
  ClipboardList,
  Package,
  Star,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';

// ── Injeção de fonte (Plus Jakarta Sans) ─────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    .font-display   { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-body      { font-family: 'Plus Jakarta Sans', sans-serif; }

    /* ── Animações ───────────────────────────────────────────────── */
    @keyframes float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-20px) rotate(3deg); }
    }
    @keyframes wave1 {
      0%   { transform: translateX(0)   translateZ(0) scaleY(1); }
      50%  { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
      100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
    }
    @keyframes wave2 {
      0%   { transform: translateX(0)   translateZ(0) scaleY(1); }
      50%  { transform: translateX(-30%) translateZ(0) scaleY(1.2); }
      100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes blink {
      0%,100% { opacity:1; } 50% { opacity:0; }
    }

    .animate-float      { animation: float 6s ease-in-out infinite; }
    .animate-float-slow { animation: float 9s ease-in-out infinite; }
    .animate-wave1      { animation: wave1 8s linear infinite; }
    .animate-wave2      { animation: wave2 6s linear infinite; }
    .animate-slideUp    { animation: slideUp .7s cubic-bezier(.16,1,.3,1) forwards; }
    .animate-fadeIn     { animation: fadeIn .6s ease forwards; }
    .animate-scaleIn    { animation: scaleIn .6s cubic-bezier(.16,1,.3,1) forwards; }
    .animate-ticker     { animation: ticker 24s linear infinite; }
    .animate-blink      { animation: blink 1s step-end infinite; }

    .shimmer-text {
      background: linear-gradient(90deg,#fff 30%,#7dd3fc 50%,#fff 70%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }

    /* ── Glassmorphism card ──────────────────────────────────────── */
    .glass {
      background: rgba(255,255,255,.07);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,.15);
    }
    .glass-dark {
      background: rgba(2,20,40,.55);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,.08);
    }

    /* ── Input focus glow ────────────────────────────────────────── */
    .input-glow:focus {
      box-shadow: 0 0 0 3px rgba(56,189,248,.25), 0 0 20px rgba(56,189,248,.15);
    }

    /* ── Feature card hover ─────────────────────────────────────── */
    .feature-card {
      transition: transform .3s ease, box-shadow .3s ease, background .3s ease;
    }
    .feature-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 24px 48px rgba(0,0,0,.25);
    }

    /* ── Ticker tape ────────────────────────────────────────────── */
    .ticker-wrap { overflow: hidden; white-space: nowrap; }

    /* ── Stagger delays ─────────────────────────────────────────── */
    .delay-100 { animation-delay: .10s; }
    .delay-200 { animation-delay: .20s; }
    .delay-300 { animation-delay: .30s; }
    .delay-400 { animation-delay: .40s; }
    .delay-500 { animation-delay: .50s; }
    .delay-600 { animation-delay: .60s; }
    .opacity-0-start { opacity: 0; }
  `}</style>
);

// ── Wave SVG background (animado) ─────────────────────────────────
const OceanBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Deep ocean gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#020c1a] via-[#021428] to-[#011020]" />

    {/* Nebula blobs */}
    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(14,116,144,.25) 0%, transparent 70%)' }} />
    <div className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(7,89,133,.20) 0%, transparent 70%)' }} />
    <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(56,189,248,.06) 0%, transparent 70%)' }} />

    {/* Star field */}
    {Array.from({ length: 60 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          top: `${Math.random() * 60}%`,
          left: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.5 + 0.1,
          animationDelay: `${Math.random() * 4}s`,
          animation: `blink ${2 + Math.random() * 3}s step-end infinite`,
        }}
      />
    ))}

    {/* Wave layers */}
    <div className="absolute bottom-0 left-0 w-[200%] h-48 opacity-30 animate-wave1">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1440,20 1440,60 L1440,120 L0,120 Z"
          fill="url(#waveGrad1)" />
        <defs>
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="absolute bottom-0 left-0 w-[200%] h-36 opacity-20 animate-wave2" style={{ animationDelay: '-3s' }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,80 C200,40 400,100 600,60 C800,20 1000,80 1200,50 C1320,30 1380,70 1440,60 L1440,120 L0,120 Z"
          fill="url(#waveGrad2)" />
        <defs>
          <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#011020] to-transparent opacity-80" />
  </div>
);

// ── Ticker Tape ───────────────────────────────────────────────────
const TickerTape = () => {
  const items = [
    '🌊 Tábua de Marés em tempo real',
    '🏖️ Gestão de Passeios & Tours',
    '💰 Comissões automáticas',
    '📱 WhatsApp Integrado',
    '🔧 Ordens de Serviço Kanban',
    '📦 Achados & Perdidos',
    '🏨 Controle de Apartamentos',
    '📊 Relatórios & Dashboards',
  ];
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap py-2 border-y border-white/10 mb-6 sm:mb-8 opacity-60">
      <div className="inline-flex gap-12 animate-ticker">
        {doubled.map((item, i) => (
          <span key={i} className="font-body text-xs text-sky-300/80 tracking-widest uppercase whitespace-nowrap">
            {item}
            <span className="ml-12 text-sky-600">·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Floating Bubbles decorativas ─────────────────────────────────
const Bubbles = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {[
      { size: 280, top: '10%', left: '5%', delay: '0s', dur: '7s' },
      { size: 160, top: '60%', left: '2%', delay: '2s', dur: '9s' },
      { size: 100, top: '30%', right: '4%', delay: '1s', dur: '6s' },
      { size: 200, top: '75%', right: '8%', delay: '3s', dur: '8s' },
    ].map((b, i) => (
      <div
        key={i}
        className="absolute rounded-full border border-sky-500/10"
        style={{
          width: b.size,
          height: b.size,
          top: b.top,
          left: (b as any).left,
          right: (b as any).right,
          background: 'radial-gradient(circle at 30% 30%, rgba(56,189,248,.05), transparent 70%)',
          animation: `float ${b.dur} ease-in-out ${b.delay} infinite`,
        }}
      />
    ))}
  </div>
);

// ── Feature Card ─────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  accentColor: string;
  delay: string;
}
const FeatureCard = ({ icon, title, description, badge, accentColor, delay }: FeatureCardProps) => (
  <div
    className="feature-card glass rounded-2xl p-5 cursor-default opacity-0-start animate-slideUp"
    style={{ animationDelay: delay, animationFillMode: 'forwards' }}
  >
    <div className="flex items-start gap-4">
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg"
        style={{ background: accentColor, boxShadow: `0 8px 24px ${accentColor}55` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-body font-semibold text-white text-sm">{title}</h3>
          {badge && (
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {badge}
            </span>
          )}
        </div>
        <p className="font-body text-xs text-white/50 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// ── Stat Badge ────────────────────────────────────────────────────
const StatBadge = ({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-1 px-4 py-3 glass rounded-2xl min-w-[80px]">
    <div className="text-sky-400 mb-0.5">{icon}</div>
    <div className="font-display text-xl font-bold text-white">{value}</div>
    <div className="font-body text-[10px] text-white/40 text-center leading-tight">{label}</div>
  </div>
);

// ── Main LoginPage ────────────────────────────────────────────────
export function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [focused, setFocused]     = useState<string | null>(null);
  // Removido 'mounted' e useEffect pois não eram utilizados

  const { login }      = useAuth();
  const { showToast }  = useToast();
  const navigate       = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { showToast('Preencha todos os campos', 'warning'); return; }
    setLoading(true);
    try {
      await login(email, password);
      await new Promise(r => setTimeout(r, 500));
      const currentUser = auth.currentUser;
      if (currentUser) await currentUser.getIdToken(true);
      showToast('Bem-vindo de volta! 🌴', 'success');
      navigate('/');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Credenciais inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features: FeatureCardProps[] = [
    {
      icon: <Umbrella className="w-5 h-5" />,
      title: 'Passeios & Tours',
      description: 'Cadastre, gerencie e divulgue passeios com galeria de fotos e envio via WhatsApp.',
      badge: 'Popular',
      accentColor: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
      delay: '.3s',
    },
    {
      icon: <Percent className="w-5 h-5" />,
      title: 'Comissões',
      description: 'Controle vendas, comissionamento por vendedor, promoções e relatórios por período.',
      accentColor: 'linear-gradient(135deg,#10b981,#34d399)',
      delay: '.4s',
    },
    {
      icon: <Waves className="w-5 h-5" />,
      title: 'Tábua de Marés',
      description: 'Previsão atualizada das marés de Pipa com envio automático para hóspedes.',
      badge: 'Tempo real',
      accentColor: 'linear-gradient(135deg,#6366f1,#818cf8)',
      delay: '.5s',
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      title: 'Ordens de Serviço',
      description: 'Board Kanban completo para gestão de manutenções e serviços do hotel.',
      accentColor: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
      delay: '.6s',
    },
    {
      icon: <Package className="w-5 h-5" />,
      title: 'Achados & Perdidos',
      description: 'Registro com foto, QR-code, etiquetas e rastreamento de itens encontrados.',
      accentColor: 'linear-gradient(135deg,#ec4899,#f472b6)',
      delay: '.7s',
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'WhatsApp Integrado',
      description: 'Compartilhamento com um clique de promoções, marés e informações para hóspedes.',
      accentColor: 'linear-gradient(135deg,#22c55e,#4ade80)',
      delay: '.8s',
    },
  ];

  return (
    <div className="font-body min-h-screen flex flex-col relative overflow-hidden bg-[#020c1a]">
      <FontStyle />
      <OceanBackground />
      <Bubbles />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <div
          className="flex items-center gap-3 opacity-0-start animate-fadeIn"
          style={{ animationDelay: '.1s', animationFillMode: 'forwards' }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-lg opacity-60"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }} />
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)' }}>
              <Waves className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white leading-none">
              H<span className="text-sky-400">Panel</span>
            </div>
            <div className="font-body text-[10px] text-white/40 tracking-widest uppercase leading-none mt-0.5">
              Hotel da Pipa
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div
          className="hidden sm:flex items-center gap-3 opacity-0-start animate-fadeIn"
          style={{ animationDelay: '.2s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-body text-xs text-white/60">Sistema Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span className="font-body text-xs text-white/60">SSL Seguro</span>
          </div>
        </div>
      </header>

      {/* ── Ticker ──────────────────────────────────────────────── */}
      <div className="relative z-20 px-0">
        <TickerTape />
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8 lg:pb-16">
        <div className="w-full max-w-7xl">
          <div className="grid xl:grid-cols-[1fr_450px] lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start">

            {/* ── LEFT PANEL ──────────────────────────────────── */}
            <div className="hidden lg:flex flex-col gap-8">

              {/* Hero headline */}
              <div
                className="opacity-0-start animate-slideUp"
                style={{ animationDelay: '.15s', animationFillMode: 'forwards' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full mb-5">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="font-body text-xs text-amber-300/80 tracking-wider uppercase">
                    Sistema de Gestão Hoteleira
                  </span>
                </div>

                <h1 className="font-display text-4xl xl:text-6xl font-bold leading-[1.1] mb-4">
                  <span className="text-white">Gerencie seu</span>
                  <br />
                  <span className="shimmer-text">hotel com</span>
                  <br />
                  <span className="text-white font-italic italic">inteligência.</span>
                </h1>

                <p className="font-body text-base text-white/50 leading-relaxed max-w-lg">
                  Uma plataforma completa construída exclusivamente para o Hotel da Pipa —
                  do controle de toalhas às comissões de vendas, tudo integrado em um só lugar.
                </p>
              </div>

              {/* Stats row */}
              <div
                className="flex gap-3 opacity-0-start animate-slideUp"
                style={{ animationDelay: '.25s', animationFillMode: 'forwards' }}
              >
                <StatBadge icon={<TrendingUp className="w-4 h-4" />} value="+34%" label="Vendas este mês" />
                <StatBadge icon={<Users className="w-4 h-4" />} value="12" label="Passeios ativos" />
                <StatBadge icon={<Waves className="w-4 h-4" />} value="24/7" label="Gestão integrada" />
                <StatBadge icon={<ShieldCheck className="w-4 h-4" />} value="100%" label="Uptime garantido" />
              </div>

              {/* Features 2×3 grid */}
              <div className="grid grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <FeatureCard key={i} {...f} />
                ))}
              </div>

              {/* Bottom quote */}
              <div
                className="flex items-center gap-3 opacity-0-start animate-fadeIn"
                style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  P
                </div>
                <div>
                  <div className="font-body text-xs text-white/70 italic">
                    "Feito com ❤️ para o time do Hotel da Pipa"
                  </div>
                  <div className="font-body text-[10px] text-white/30 tracking-wider uppercase">
                    Praia de Pipa · Rio Grande do Norte · Brasil
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL — Login Card ─────────────────────── */}
            <div className="w-full max-w-lg mx-auto lg:max-w-none opacity-0-start animate-scaleIn"
              style={{ animationDelay: '.2s', animationFillMode: 'forwards' }}
            >
              {/* Outer glow */}
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-3xl blur-2xl opacity-40"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1, #38bdf8)' }}
                />

                <div className="relative glass-dark rounded-3xl overflow-hidden shadow-2xl">

                  {/* Card top gradient bar */}
                  <div className="h-1 w-full" style={{
                    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8, #0284c7, #7dd3fc, #0ea5e9)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                  }} />

                  {/* Card Header */}
                  <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-5">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                          style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }} />
                        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                          style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)' }}>
                          <Waves className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full mb-4">
                      <Lock className="w-3 h-3 text-sky-400" />
                      <span className="font-body text-xs text-sky-300/70 tracking-widest uppercase">
                        Acesso Restrito
                      </span>
                    </div>

                    <h2 className="font-display text-3xl text-white font-bold mb-1">
                      Bem-vindo de volta
                    </h2>
                    <p className="font-body text-sm text-white/40">
                      Entre com suas credenciais para acessar o painel
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="mx-6 sm:mx-8 h-px bg-white/8" />

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-7 space-y-5">

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="font-body text-xs font-medium text-white/50 uppercase tracking-wider">
                        E-mail corporativo
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                          focused === 'email' ? 'text-sky-400' : email ? 'text-emerald-400' : 'text-white/20'
                        }`} />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused(null)}
                          placeholder="seu.nome@hoteldapipa.com"
                          autoFocus
                          className="input-glow w-full pl-11 pr-11 py-3.5 rounded-xl font-body text-sm text-white placeholder-white/20 outline-none transition-all duration-300"
                          style={{
                            background: 'rgba(255,255,255,.05)',
                            border: `1px solid ${
                              focused === 'email' ? 'rgba(56,189,248,.6)'
                              : email           ? 'rgba(52,211,153,.5)'
                              : 'rgba(255,255,255,.08)'
                            }`,
                          }}
                        />
                        {email && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="font-body text-xs font-medium text-white/50 uppercase tracking-wider">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                          focused === 'password' ? 'text-sky-400' : password ? 'text-emerald-400' : 'text-white/20'
                        }`} />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused('password')}
                          onBlur={() => setFocused(null)}
                          placeholder="••••••••••"
                          className="input-glow w-full pl-11 pr-11 py-3.5 rounded-xl font-body text-sm text-white placeholder-white/20 outline-none transition-all duration-300"
                          style={{
                            background: 'rgba(255,255,255,.05)',
                            border: `1px solid ${
                              focused === 'password' ? 'rgba(56,189,248,.6)'
                              : password            ? 'rgba(52,211,153,.5)'
                              : 'rgba(255,255,255,.08)'
                            }`,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                          tabIndex={-1}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-4 rounded-xl font-body font-semibold text-sm text-white overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
                        boxShadow: '0 8px 32px rgba(14,165,233,.35)',
                      }}
                    >
                      {/* Hover shimmer */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Autenticando...
                          </>
                        ) : (
                          <>
                            Entrar no Sistema
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  {/* Card Footer — mobile features teaser */}
                  <div className="lg:hidden px-6 sm:px-8 pb-6 space-y-2">
                    <div className="h-px bg-white/8 mb-4" />
                    <p className="font-body text-xs text-white/30 text-center mb-3 uppercase tracking-widest">
                      O que você vai encontrar
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: '🏖️', label: 'Passeios & Tours' },
                        { icon: '💰', label: 'Comissões' },
                        { icon: '🌊', label: 'Tábua de Marés' },
                        { icon: '🔧', label: 'Ordens de Serviço' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 glass rounded-xl">
                          <span className="text-sm">{item.icon}</span>
                          <span className="font-body text-xs text-white/50">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-5 px-6 sm:px-8 pb-8">
                    {[
                      { dot: 'bg-emerald-500', label: 'Sistema seguro' },
                      { dot: 'bg-sky-500', label: 'SSL Ativo' },
                      { dot: 'bg-blue-500', label: 'v1.0.1' },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot} ${i === 0 ? 'animate-pulse' : ''}`} />
                        <span className="font-body text-[10px] text-white/30">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Below-card note */}
              <div className="mt-4 text-center">
                <p className="font-body text-xs text-white/20">
                  Sistema interno — apenas funcionários autorizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}