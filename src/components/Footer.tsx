// src/components/Footer.tsx
import { memo, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── Ícone do GitHub (extraído para evitar re-render) ─────────────────────────

const GitHubIcon = memo(function GitHubIcon() {
  return (
    <svg
      className="w-4 h-4 fill-current shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
});

// ─── Componente ───────────────────────────────────────────────────────────────

export const Footer = memo(function Footer() {
  const { theme } = useTheme();

  // Calculado uma única vez por montagem — não muda durante a sessão
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const isDark = theme === 'dark';

  return (
    <footer
      className={`
        mt-12 mb-6 px-4 py-8 border-t transition-colors duration-300
        ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}
      `}
      aria-label="Rodapé do sistema"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* ── Branding ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold tracking-tighter text-lg leading-none ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
              aria-label="HPanel"
            >
              H<span className="text-blue-500">Panel</span>
            </span>

            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 rounded-full select-none"
              aria-label="Versão 1.0.1"
            >
              v1.0.1
            </span>
          </div>

          <p className="text-xs tracking-wide">
            <span aria-hidden="true">© </span>
            <span>{currentYear} Todos os direitos reservados.</span>
          </p>
        </div>

        {/* ── Créditos ──────────────────────────────────────────────────────── */}
        <div
          className={`
            group flex items-center gap-2.5 px-4 py-2 rounded-2xl border
            transition-all duration-200
            ${isDark
              ? 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
              : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'
            }
          `}
        >
          <span className="text-[11px] font-medium uppercase tracking-tight select-none whitespace-nowrap">
            Desenvolvido por
          </span>

          <a
            href="https://github.com/Avadatrum"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Perfil do desenvolvedor Wemerson (Avadatrum) no GitHub — abre em nova aba"
            className={`
              flex items-center gap-1.5 font-semibold text-sm
              transition-all duration-150
              hover:scale-105 active:scale-100
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded
              ${isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
              }
            `}
          >
            <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">
              <GitHubIcon />
            </span>
            Wemerson — Avadatrum
          </a>
        </div>

      </div>
    </footer>
  );
});