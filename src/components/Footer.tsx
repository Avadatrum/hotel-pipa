// src/components/Footer.tsx
import { useTheme } from '../contexts/ThemeContext';

export function Footer() {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`
      mt-8 py-4 border-t text-center text-sm
      ${theme === 'dark' 
        ? 'border-gray-700 text-gray-400' 
        : 'border-gray-200 text-gray-500'
      }
    `}>
      <p>
        HPanel Desenvolvido com carinho por{' '}
        <a
          href="https://github.com/Avadatrum"
          target="_blank"
          rel="noopener noreferrer"
          className={`
            font-medium transition-colors
            ${theme === 'dark'
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-800'
            }
          `}
        >
          Wemerson - Avadatrum
        </a>
        {' '}Versão 1.0.0 © {currentYear}
      </p>
    </footer>
  );
}