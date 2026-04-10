// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './styles/index.css';

// Contexts e Hooks
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './contexts/AuthContext';
import { OSProvider } from './contexts/OSContext'; // <--- Adicionei aqui

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Tema envolve tudo, pois afeta a UI globalmente */}
    <ThemeProvider>
      {/* 2. Toast permite notificações em qualquer lugar */}
      <ToastProvider>
        {/* 3. Auth controla o acesso, então geralmente vem antes dos dados de negócio */}
        <AuthProvider>
          {/* 4. OSProvider fornece os dados para as rotas abaixo */}
          <OSProvider>
            <RouterProvider router={router} />
          </OSProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);