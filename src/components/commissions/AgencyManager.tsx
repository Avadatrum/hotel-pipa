// src/components/commissions/AgencyManager.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import type { Agency } from '../../types';

export function AgencyManager() {
  const { user } = useAuth();
  const { agencies, sales, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    taxaComissaoPersonalizada: ''
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estatísticas por agência baseadas nas vendas
  const agencyStats = useMemo(() => {
    const stats: Record<string, { totalVendas: number; totalComissao: number; qtdVendas: number }> = {};
    sales?.forEach(sale => {
      if (sale.status !== 'confirmada') return;
      // Tenta associar a venda à agência pelo ID do passeio ou campo agenciaId
      const agId = (sale as any).agenciaId;
      if (agId) {
        if (!stats[agId]) stats[agId] = { totalVendas: 0, totalComissao: 0, qtdVendas: 0 };
        stats[agId].totalVendas += sale.valorTotal;
        stats[agId].totalComissao += sale.comissaoCalculada;
        stats[agId].qtdVendas += 1;
      }
    });
    return stats;
  }, [sales]);

  // Filtragem de agências por busca
  const filteredAgencies = useMemo(() => {
    if (!searchTerm.trim()) return agencies;
    const lower = searchTerm.toLowerCase();
    return agencies.filter(
      a =>
        a.nome.toLowerCase().includes(lower) ||
        a.email?.toLowerCase().includes(lower) ||
        a.telefone?.includes(lower)
    );
  }, [agencies, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('Preencha o nome da agência', 'warning');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('E-mail inválido', 'warning');
      return;
    }
    if (
      formData.taxaComissaoPersonalizada &&
      (isNaN(Number(formData.taxaComissaoPersonalizada)) ||
        Number(formData.taxaComissaoPersonalizada) < 0 ||
        Number(formData.taxaComissaoPersonalizada) > 100)
    ) {
      showToast('Taxa de comissão deve ser entre 0 e 100', 'warning');
      return;
    }
    setLoading(true);
    try {
      const agencyData = {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        taxaComissaoPersonalizada: formData.taxaComissaoPersonalizada
          ? parseFloat(formData.taxaComissaoPersonalizada)
          : null,
        updatedAt: Timestamp.now(),
        ...(editingAgency ? {} : { createdAt: Timestamp.now(), createdBy: user?.id })
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
    if (!confirm(`Tem certeza que deseja excluir a agência "${agency.nome}"?\n\nEssa ação não pode ser desfeita.`))
      return;
    setDeletingId(agency.id);
    try {
      await deleteDoc(doc(db, 'agencies', agency.id));
      showToast('✅ Agência excluída com sucesso!', 'success');
      refreshData();
    } catch (error) {
      showToast('❌ Erro ao excluir agência', 'error');
    } finally {
      setDeletingId(null);
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

  const handleWhatsApp = (telefone: string) => {
    const clean = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${clean}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🏢 Agências de Passeio
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {agencies.length} agência{agencies.length !== 1 ? 's' : ''} cadastrada{agencies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span> Nova Agência
        </button>
      </div>

      {/* Busca */}
      {agencies.length > 3 && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Cards para mobile / Tabela para desktop */}
      {filteredAgencies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-gray-500 font-medium">
            {searchTerm ? 'Nenhuma agência encontrada para essa busca' : 'Nenhuma agência cadastrada ainda'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Cadastrar primeira agência
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela desktop */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comissão</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendas</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAgencies.map(agency => {
                    const stats = agencyStats[agency.id];
                    return (
                      <tr key={agency.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 dark:text-white">{agency.nome}</div>
                          {agency.email && (
                            <div className="text-xs text-gray-400">{agency.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            {agency.telefone ? (
                              <button
                                onClick={() => handleWhatsApp(agency.telefone!)}
                                className="text-green-600 hover:text-green-800 text-left flex items-center gap-1 text-xs"
                                title="Abrir no WhatsApp"
                              >
                                📱 {agency.telefone}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Sem telefone</span>
                            )}
                            {agency.email && (
                              <button
                                onClick={() => handleEmail(agency.email!)}
                                className="text-blue-500 hover:text-blue-700 text-left text-xs truncate max-w-[160px]"
                                title={agency.email}
                              >
                                ✉️ {agency.email}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {agency.taxaComissaoPersonalizada != null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {agency.taxaComissaoPersonalizada}% personalizada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              Padrão
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {stats ? (
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300">
                                {stats.qtdVendas} venda{stats.qtdVendas !== 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                R$ {stats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Sem vendas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(agency)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(agency)}
                              disabled={deletingId === agency.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-40"
                              title="Excluir"
                            >
                              {deletingId === agency.id ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {filteredAgencies.map(agency => {
              const stats = agencyStats[agency.id];
              return (
                <div key={agency.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{agency.nome}</h3>
                      {agency.taxaComissaoPersonalizada != null ? (
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          {agency.taxaComissaoPersonalizada}% comissão
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Comissão padrão</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(agency)} className="text-blue-600 p-1">✏️</button>
                      <button
                        onClick={() => handleDelete(agency)}
                        disabled={deletingId === agency.id}
                        className="text-red-600 p-1 disabled:opacity-40"
                      >
                        {deletingId === agency.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {agency.telefone && (
                      <button
                        onClick={() => handleWhatsApp(agency.telefone!)}
                        className="flex items-center gap-1 text-green-600"
                      >
                        📱 {agency.telefone}
                      </button>
                    )}
                    {agency.email && (
                      <button
                        onClick={() => handleEmail(agency.email!)}
                        className="flex items-center gap-1 text-blue-500"
                      >
                        ✉️ {agency.email}
                      </button>
                    )}
                    {stats && (
                      <span className="text-green-600">
                        💰 {stats.qtdVendas} venda{stats.qtdVendas !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingAgency ? '✏️ Editar Agência' : '🏢 Nova Agência'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nome da agência"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="(84) 9 9999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="contato@agencia.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Comissão Personalizada (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxaComissaoPersonalizada}
                  onChange={e => setFormData({ ...formData, taxaComissaoPersonalizada: e.target.value })}
                  placeholder="Deixe vazio para usar o padrão"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Se definido, substituirá a taxa padrão do sistema para esta agência.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  {loading ? <><span className="animate-spin inline-block">⏳</span> Salvando...</> : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
