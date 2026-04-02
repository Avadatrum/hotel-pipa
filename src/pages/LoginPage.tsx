// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Função handleSubmit atualizada com logs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Formulário submetido:', { email, password });
    
    if (!email || !password) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔐 Chamando login...');
      await login(email, password);
      console.log('✅ Login successful, navegando para /');
      showToast('Login realizado com sucesso!', 'success');
      navigate('/');
    } catch (error) {
      console.error('❌ Erro detalhado:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌴</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Hotel da Pipa</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sistema de Gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="seu@email.com"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sistema interno - apenas funcionários autorizados
          </p>
        </div>
      </div>
    </div>
  );
}