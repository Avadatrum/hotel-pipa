// src/components/commissions/CommissionSettings.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useCommissions } from '../../contexts/CommissionContext';
import type { Tour, CustomCommission } from '../../types';

export function CommissionSettings() {
  const { user } = useAuth();
  const { tours, customCommissions, refreshData } = useCommissions();
  const { showToast } = useToast();
  const [globalCommission, setGlobalCommission] = useState(10);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    passeioId: '',
    tipoComissao: 'percentual' as 'percentual' | 'fixo',
    valor: 10,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: ''
  });
  const [loading, setLoading] = useState(false);

  // Carregar configuração global
  useEffect(() => {
    const loadGlobalSettings = async () => {
      const settingsRef = doc(db, 'appSettings', 'commissions');
      const settingsSnap = await getDocs(collection(db, 'appSettings'));
      // Implementar busca da configuração global
    };
    loadGlobalSettings();
  }, []);

  const handleUpdateTourCommission = async (tour: Tour, newCommission: number) => {
    if (newCommission < 0 || newCommission > 100) {
      showToast('Comissão deve ser entre 0 e 100', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const tourRef = doc(db, 'tours', tour.id);
      await updateDoc(tourRef, {
        comissaoPadrao: newCommission,
        updatedBy: user?.id,
        updatedByName: user?.name,
        updatedAt: Timestamp.now()
      });
      showToast(`Comissão do passeio ${tour.nome} atualizada para ${newCommission}%`, 'success');
      refreshData();
      setEditingTour(null);
    } catch (error) {
      showToast('Erro ao atualizar comissão', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomCommission = async () => {
    if (!customForm.passeioId) {
      showToast('Selecione um passeio', 'warning');
      return;
    }
    
    if (customForm.valor <= 0) {
      showToast('Valor deve ser maior que zero', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'customCommissions'), {
        passeioId: customForm.passeioId,
        agenciaId: null,
        tipoComissao: customForm.tipoComissao,
        valor: customForm.valor,
        dataInicio: Timestamp.fromDate(new Date(customForm.dataInicio)),
        dataFim: customForm.dataFim ? Timestamp.fromDate(new Date(customForm.dataFim)) : null,
        createdAt: Timestamp.now(),
        createdBy: user?.id
      });
      showToast('Comissão personalizada criada com sucesso!', 'success');
      refreshData();
      setShowCustomModal(false);
      setCustomForm({ passeioId: '', tipoComissao: 'percentual', valor: 10, dataInicio: new Date().toISOString().split('T')[0], dataFim: '' });
    } catch (error) {
      showToast('Erro ao criar comissão personalizada', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomCommission = async (commission: CustomCommission) => {
    if (confirm('Tem certeza que deseja excluir esta comissão personalizada?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'customCommissions', commission.id));
        showToast('Comissão personalizada excluída', 'success');
        refreshData();
      } catch (error) {
        showToast('Erro ao excluir', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const activeCustomCommissions = customCommissions.filter(c => !c.dataFim || new Date(c.dataFim.toDate()) > new Date());

  return (
    <div className="space-y-6">
      {/* Configuração de Comissão por Passeio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>🎫</span> Comissão por Passeio
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-sm">Passeio</th>
                <th className="px-3 py-2 text-center text-sm">Comissão Atual</th>
                <th className="px-3 py-2 text-center text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tours.map(tour => (
                <tr key={tour.id}>
                  <td className="px-3 py-2 text-sm">{tour.nome}</td>
                  <td className="px-3 py-2 text-sm text-center font-bold text-green-600">
                    {tour.comissaoPadrao}%
                  </td>
                  <td className="px-3 py-2 text-center">
                    {editingTour?.id === tour.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          defaultValue={tour.comissaoPadrao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTourCommission(tour, parseInt((e.target as HTMLInputElement).value));
                            }
                          }}
                          className="w-16 border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          max="100"
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingTour(null)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingTour(tour)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Editar
                      </button>
                    )}
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      </div>

      {/* Comissões Personalizadas Temporárias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <span>⏰</span> Comissões Personalizadas (Temporárias)
          </h3>
          <button
            onClick={() => setShowCustomModal(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            + Nova Promoção
          </button>
        </div>
        
        {activeCustomCommissions.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhuma comissão personalizada ativa</p>
        ) : (
          <div className="space-y-2">
            {activeCustomCommissions.map(commission => {
              const tour = tours.find(t => t.id === commission.passeioId);
              return (
                <div key={commission.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{tour?.nome || commission.passeioId}</p>
                    <p className="text-xs text-gray-500">
                      {commission.tipoComissao === 'percentual' 
                        ? `${commission.valor}% de comissão` 
                        : `R$ ${commission.valor} fixo`}
                      {commission.dataFim && ` • até ${commission.dataFim.toDate().toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCustomCommission(commission)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Criar Comissão Personalizada */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nova Comissão Personalizada</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Passeio</label>
                <select
                  value={customForm.passeioId}
                  onChange={(e) => setCustomForm({ ...customForm, passeioId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Selecione um passeio</option>
                  {tours.map(tour => (
                    <option key={tour.id} value={tour.id}>{tour.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={customForm.tipoComissao}
                  onChange={(e) => setCustomForm({ ...customForm, tipoComissao: e.target.value as 'percentual' | 'fixo' })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="fixo">Valor Fixo (R$)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {customForm.tipoComissao === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customForm.valor}
                  onChange={(e) => setCustomForm({ ...customForm, valor: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data de Início</label>
                <input
                  type="date"
                  value={customForm.dataInicio}
                  onChange={(e) => setCustomForm({ ...customForm, dataInicio: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data de Fim (opcional)</label>
                <input
                  type="date"
                  value={customForm.dataFim}
                  onChange={(e) => setCustomForm({ ...customForm, dataFim: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCustomCommission}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Promoção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}