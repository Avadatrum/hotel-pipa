// src/components/ChangePasswordModal.tsx
import { useState } from 'react';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '../hooks/useToast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast('As senhas não coincidem', 'warning');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }
      
      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Atualizar senha
      await updatePassword(user, newPassword);
      
      showToast('Senha alterada com sucesso!', 'success');
      onSuccess();
      onClose();
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.code === 'auth/wrong-password') {
        showToast('Senha atual incorreta', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      } else {
        showToast('Erro ao alterar senha. Tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-slide-up"
        style={{ 
          marginTop: 'auto',
          marginBottom: 'auto'
        }}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              🔐 Alterar Senha
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <p className="text-xs text-gray-400">
            A senha deve ter no mínimo 6 caracteres.
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}