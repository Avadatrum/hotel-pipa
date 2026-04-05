// src/components/Footer.tsx
import { useTheme } from '../contexts/ThemeContext';

export function Footer() {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`
      mt-12 mb-6 px-4 py-8 border-t transition-all duration-500
      ${theme === 'dark' 
        ? 'border-slate-800 text-slate-500' 
        : 'border-slate-200 text-slate-400'
      }
    `}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Lado Esquerdo: Branding e Copyright */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tighter text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              H<span className="text-blue-500">Panel</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 rounded-full">
              v1.0.1
            </span>
          </div>
          <p className="text-xs tracking-wide">
            © {currentYear} Todos os direitos reservados.
          </p>
        </div>

        {/* Centro/Direita: Créditos com estilo */}
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors
          ${theme === 'dark' 
            ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
          }
        `}>
          <span className="text-[11px] font-medium uppercase tracking-tight">Desenvolvido por</span>
          <a
            href="https://github.com/Avadatrum"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-1.5 font-semibold text-sm transition-all hover:scale-105
              ${theme === 'dark'
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
              }
            `}
          >
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            Wemerson - Avadatrum
          </a>
        </div>

      </div>
    </footer>
  );
}