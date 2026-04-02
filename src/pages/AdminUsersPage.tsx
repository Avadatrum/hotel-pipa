// src/pages/AdminUsersPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { createUser, updateUser, resetUserPassword, deleteUser, isLastAdmin } from '../services/authService';
import type { User } from '../types';

export function AdminUsersPage() {
  const { user: currentUser, users, refreshUsers } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as 'admin' | 'operator',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, []);

  // --- FUNÇÃO SUBSTITUÍDA ABAIXO ---

  // Substitua a função handleSubmit por esta versão corrigida:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Formulário submetido:', formData);
    
    if (!formData.name || !formData.email) {
      showToast('Preencha nome e e-mail', 'warning');
      return;
    }
    
    if (!editingUser && !formData.password) {
      showToast('Senha é obrigatória para novo usuário', 'warning');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      if (editingUser) {
        console.log('📝 Editando usuário:', editingUser.id);
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
        showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        console.log('📝 Criando novo usuário...');
        await createUser(
          { name: formData.name, email: formData.email, role: formData.role },
          formData.password,
          currentUser!.id
        );
        showToast('Usuário criado com sucesso!', 'success');
      }
      await refreshUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro detalhado ao salvar usuário:', error);
      showToast(`Erro ao salvar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt('Digite a nova senha para ' + user.name);
    if (newPassword && newPassword.length >= 6) {
      setLoading(true);
      try {
        await resetUserPassword(user.id, newPassword);
        showToast(`Senha de ${user.name} redefinida com sucesso!`, 'success');
      } catch (error) {
        showToast('Erro ao redefinir senha', 'error');
      } finally {
        setLoading(false);
      }
    } else if (newPassword) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('Você não pode excluir a si mesmo', 'error');
      return;
    }
    
    const lastAdmin = await isLastAdmin(user.id);
    if (lastAdmin) {
      showToast('Não é possível excluir o último administrador do sistema', 'error');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      setLoading(true);
      try {
        await deleteUser(user.id);
        await refreshUsers();
        showToast('Usuário excluído com sucesso!', 'success');
      } catch (error) {
        showToast('Erro ao excluir usuário', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'operator' });
    setEditingUser(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Usuários</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Cadastre e gerencie os funcionários do sistema
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nível</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Criado em</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }
                    `}>
                      {user.role === 'admin' ? 'Admin Geral' : 'Operador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 text-sm"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Senha</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required={!editingUser}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nível de Acesso</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Admin Geral</option>
                </select>
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}