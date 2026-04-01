// src/hooks/useNavigation.ts
import { useNavigate, useLocation } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mapeia URLs para nomes de página
  const pathToPage: Record<string, string> = {
    '/': 'apts',
    '/painel': 'dashboard',
    '/perdas': 'losses',
    '/historico': 'log',
    '/recibos': 'recibos',
    '/documentos': 'documentos',
  };

  // Mapeia nomes de página para URLs
  const pageToPath: Record<string, string> = {
    apts: '/',
    dashboard: '/painel',
    losses: '/perdas',
    log: '/historico',
    recibos: '/recibos',
    documentos: '/documentos',
  };

  // Página atual baseada na URL
  const currentPage = pathToPage[location.pathname] || 'apts';

  // Função para navegar
  const navigateTo = (page: string) => {
    const path = pageToPath[page];
    if (path) {
      navigate(path);
    }
  };

  return { currentPage, navigateTo };
}