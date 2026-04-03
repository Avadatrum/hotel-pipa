// src/components/commissions/AgencyManager.tsx
import { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import type { Agency } from '../../types';

export function AgencyManager() {
  const { user } = useAuth();
  const { agencies, refreshData } = useCommissions();
  const { showToast } = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    taxaComissaoPersonalizada: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      showToast('Preencha o nome da agência', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const agencyData = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        taxaComissaoPersonalizada: formData.taxaComissaoPersonalizada ? parseFloat(formData.taxaComissaoPersonalizada) : null,
        createdAt: Timestamp.now(),
        createdBy: user?.id
      };
      
      if (editingAgency) {
        await updateDoc(doc(db, 'agencies', editingAgency.id), agencyData);
        showToast('✅ Agência atualizada com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'agencies'), agencyData);
        showToast('✅ Agência criada com sucesso!', 'success');
      }
      
      refreshData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar agência:', error);
      showToast('❌ Erro ao salvar agência', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agency: Agency) => {
    if (confirm(`Tem certeza que deseja excluir a agência "${agency.nome}"?`)) {
      try {
        await deleteDoc(doc(db, 'agencies', agency.id));
        showToast('✅ Agência excluída com sucesso!', 'success');
        refreshData();
      } catch (error) {
        showToast('❌ Erro ao excluir agência', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', telefone: '', email: '', taxaComissaoPersonalizada: '' });
    setEditingAgency(null);
  };

  const openEditModal = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      nome: agency.nome,
      telefone: agency.telefone || '',
      email: agency.email || '',
      taxaComissaoPersonalizada: agency.taxaComissaoPersonalizada?.toString() || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">🏢 Agências de Passeio</h2>
          <p className="text-sm text-gray-500">Gerencie as agências parceiras</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Agência
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Nome</th>
                <th className="px-4 py-3 text-left text-sm">Telefone</th>
                <th className="px-4 py-3 text-left text-sm">Comissão Personalizada</th>
                <th className="px-4 py-3 text-center text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agencies.map(agency => (
                <tr key={agency.id}>
                  <td className="px-4 py-3 text-sm font-medium">{agency.nome}</td>
                  <td className="px-4 py-3 text-sm">{agency.telefone || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {agency.taxaComissaoPersonalizada 
                      ? `${agency.taxaComissaoPersonalizada}%` 
                      : 'Padrão'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEditModal(agency)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(agency)}
                      className="text-red-600 hover:text-red-800"
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
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingAgency ? 'Editar Agência' : 'Nova Agência'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Comissão Personalizada (% - opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.taxaComissaoPersonalizada}
                  onChange={(e) => setFormData({ ...formData, taxaComissaoPersonalizada: e.target.value })}
                  placeholder="Deixe vazio para usar padrão"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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