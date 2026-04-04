// src/components/commissions/CommissionSettings.tsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, getDoc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useCommissions } from '../../contexts/CommissionContext';
import type { Tour, CustomCommission } from '../../types';

const fmt = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CommissionSettings() {
  const { user } = useAuth();
  const { tours, customCommissions, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [globalCommission, setGlobalCommission] = useState(0);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editingNameTourId, setEditingNameTourId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [editingPriceTourId, setEditingPriceTourId] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState(0);
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [globalInputValue, setGlobalInputValue] = useState(0);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [customForm, setCustomForm] = useState({
    passeioId: '',
    valor: 0,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: ''
  });

  const [tourForm, setTourForm] = useState({
    nome: '',
    precoBase: 0,
    comissaoPadrao: 0,
    unidade: 'pax',
    agenciaId: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'appSettings', 'commissions'));
        if (snap.exists()) {
          const data = snap.data();
          setGlobalCommission(data.valorPadrao || 0);
          setGlobalInputValue(data.valorPadrao || 0);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    load();
  }, []);

  // Passeios filtrados
  const filteredTours = useMemo(() => {
    let list = tours || [];
    if (!showInactive) list = list.filter(t => t.ativo !== false);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(t => t.nome.toLowerCase().includes(lower));
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [tours, showInactive, searchTerm]);

  // Promoções ativas e expiradas
  const { activePromos, expiredPromos } = useMemo(() => {
    const now = new Date();
    const active: CustomCommission[] = [];
    const expired: CustomCommission[] = [];
    (customCommissions || []).forEach(c => {
      if (!c.dataFim || c.dataFim.toDate() > now) active.push(c);
      else expired.push(c);
    });
    return { activePromos: active, expiredPromos: expired };
  }, [customCommissions]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUpdateGlobalCommission = async () => {
    if (globalInputValue < 0) { showToast('O valor não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appSettings', 'commissions'), {
        valorPadrao: globalInputValue,
        updatedBy: user?.id,
        updatedByName: user?.name,
        updatedAt: Timestamp.now()
      });
      setGlobalCommission(globalInputValue);
      showToast('✅ Comissão padrão atualizada!', 'success');
      setEditingGlobal(false);
    } catch { showToast('Erro ao atualizar configuração', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateTourName = async (tourId: string) => {
    if (!newNameInput.trim()) { showToast('O nome não pode ficar vazio', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tourId), {
        nome: newNameInput.trim(),
        updatedBy: user?.id, updatedByName: user?.name, updatedAt: Timestamp.now()
      });
      showToast('✅ Nome atualizado!', 'success');
      refreshData();
      setEditingNameTourId(null);
    } catch { showToast('Erro ao atualizar nome', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateTourPrice = async (tourId: string) => {
    if (newPriceInput < 0) { showToast('O preço não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tourId), {
        precoBase: newPriceInput,
        updatedBy: user?.id, updatedByName: user?.name, updatedAt: Timestamp.now()
      });
      showToast('✅ Preço atualizado!', 'success');
      refreshData();
      setEditingPriceTourId(null);
    } catch { showToast('Erro ao atualizar preço', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateTourCommission = async (tour: Tour, newValue: number) => {
    if (newValue < 0) { showToast('O valor não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        comissaoPadrao: newValue,
        updatedBy: user?.id, updatedByName: user?.name, updatedAt: Timestamp.now()
      });
      showToast(`✅ Comissão de "${tour.nome}" atualizada!`, 'success');
      refreshData();
      setEditingTour(null);
    } catch { showToast('Erro ao atualizar comissão', 'error'); }
    finally { setLoading(false); }
  };

  const handleToggleTourActive = async (tour: Tour) => {
    const newStatus = tour.ativo === false ? true : false;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        ativo: newStatus,
        updatedBy: user?.id, updatedAt: Timestamp.now()
      });
      showToast(newStatus ? '✅ Passeio ativado!' : '⚠️ Passeio desativado!', 'success');
      refreshData();
    } catch { showToast('Erro ao alterar status', 'error'); }
    finally { setLoading(false); }
  };

  const handleCreateTour = async () => {
    if (!tourForm.nome.trim()) { showToast('Informe o nome do passeio', 'warning'); return; }
    if (tourForm.precoBase < 0) { showToast('Preço inválido', 'warning'); return; }
    if (tourForm.comissaoPadrao < 0) { showToast('Comissão inválida', 'warning'); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'tours'), {
        nome: tourForm.nome.trim(),
        precoBase: tourForm.precoBase,
        comissaoPadrao: tourForm.comissaoPadrao,
        unidade: tourForm.unidade,
        agenciaId: tourForm.agenciaId || null,
        ativo: true,
        createdAt: Timestamp.now(),
        createdBy: user?.id
      });
      showToast('✅ Passeio criado com sucesso!', 'success');
      refreshData();
      setShowTourModal(false);
      setTourForm({ nome: '', precoBase: 0, comissaoPadrao: 0, unidade: 'pax', agenciaId: '' });
    } catch { showToast('Erro ao criar passeio', 'error'); }
    finally { setLoading(false); }
  };

  const handleCreateCustomCommission = async () => {
    if (!customForm.passeioId) { showToast('Selecione um passeio', 'warning'); return; }
    if (customForm.valor <= 0) { showToast('Valor deve ser maior que zero', 'warning'); return; }
    if (customForm.dataFim && customForm.dataFim < customForm.dataInicio) {
      showToast('Data de fim deve ser após a data de início', 'warning'); return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'customCommissions'), {
        passeioId: customForm.passeioId,
        agenciaId: null,
        valor: customForm.valor,
        dataInicio: Timestamp.fromDate(new Date(customForm.dataInicio)),
        dataFim: customForm.dataFim ? Timestamp.fromDate(new Date(customForm.dataFim)) : null,
        createdAt: Timestamp.now(),
        createdBy: user?.id
      });
      showToast('✅ Promoção criada com sucesso!', 'success');
      refreshData();
      setShowCustomModal(false);
      setCustomForm({ passeioId: '', valor: 0, dataInicio: new Date().toISOString().split('T')[0], dataFim: '' });
    } catch { showToast('Erro ao criar promoção', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteCustomCommission = async (commission: CustomCommission) => {
    if (!confirm('Excluir esta promoção de comissão?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'customCommissions', commission.id));
      showToast('✅ Promoção excluída', 'success');
      refreshData();
    } catch { showToast('Erro ao excluir', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">

      {/* ── Comissão Padrão Global ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              ⚙️ Comissão Padrão Global
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Valor base usado para novos passeios quando não há comissão específica definida.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {editingGlobal ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={globalInputValue}
                  onChange={e => setGlobalInputValue(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateGlobalCommission()}
                  className="pl-9 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 dark:bg-blue-950 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <button onClick={handleUpdateGlobalCommission} disabled={loading} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                Salvar
              </button>
              <button onClick={() => { setEditingGlobal(false); setGlobalInputValue(globalCommission); }} className="text-gray-500 dark:text-gray-400 text-sm hover:underline">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fmt(globalCommission)}</span>
              <button
                onClick={() => { setEditingGlobal(true); setGlobalInputValue(globalCommission); }}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                ✏️ Editar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Configuração dos Passeios ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            🎫 Passeios Cadastrados
            <span className="text-xs font-normal text-gray-400">({filteredTours.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInactive(s => !s)}
              className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
                showInactive ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {showInactive ? '👁 Mostrar ativos' : '👁 Ver inativos'}
            </button>
            <button
              onClick={() => setShowTourModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              + Novo Passeio
            </button>
          </div>
        </div>

        {/* Busca */}
        {(tours || []).length > 5 && (
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Buscar passeio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}

        {filteredTours.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhum passeio encontrado</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2.5 text-left">Passeio</th>
                  <th className="px-3 py-2.5 text-center">Preço Base</th>
                  <th className="px-3 py-2.5 text-center">Comissão</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTours.map(tour => (
                  <tr key={tour.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${tour.ativo === false ? 'opacity-50' : ''}`}>
                    {/* Nome */}
                    <td className="px-3 py-2.5">
                      {editingNameTourId === tour.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            defaultValue={tour.nome}
                            onChange={e => setNewNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateTourName(tour.id)}
                            className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 w-full"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateTourName(tour.id)} className="text-green-600 hover:text-green-800 font-bold px-1">✓</button>
                          <button onClick={() => setEditingNameTourId(null)} className="text-red-500 hover:text-red-700 font-bold px-1">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{tour.nome}</span>
                          <button
                            onClick={() => { setEditingNameTourId(tour.id); setNewNameInput(tour.nome); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity text-xs"
                            title="Renomear"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Preço Base */}
                    <td className="px-3 py-2.5 text-center">
                      {editingPriceTourId === tour.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={tour.precoBase}
                              onChange={e => setNewPriceInput(parseFloat(e.target.value) || 0)}
                              onKeyDown={e => e.key === 'Enter' && handleUpdateTourPrice(tour.id)}
                              className="w-24 pl-6 border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => handleUpdateTourPrice(tour.id)} className="text-green-600 hover:text-green-800 font-bold">✓</button>
                          <button onClick={() => setEditingPriceTourId(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center gap-1 group cursor-pointer"
                          onClick={() => { setEditingPriceTourId(tour.id); setNewPriceInput(tour.precoBase); }}
                          title="Clique para editar"
                        >
                          <span className="group-hover:text-blue-600 transition-colors font-medium">{fmt(tour.precoBase)}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs">✏️</span>
                        </div>
                      )}
                    </td>

                    {/* Comissão */}
                    <td className="px-3 py-2.5 text-center">
                      {editingTour?.id === tour.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={tour.comissaoPadrao}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateTourCommission(tour, parseFloat((e.target as HTMLInputElement).value) || 0);
                              }}
                              onBlur={e => handleUpdateTourCommission(tour, parseFloat(e.target.value) || 0)}
                              className="w-24 pl-6 border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => setEditingTour(null)} className="text-gray-500 hover:text-gray-700 text-xs">✕</button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center gap-1 group cursor-pointer"
                          onClick={() => setEditingTour(tour)}
                          title="Clique para editar"
                        >
                          <span className="font-bold text-green-600 dark:text-green-400 group-hover:text-green-700 transition-colors">
                            {fmt(tour.comissaoPadrao)}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-green-400 text-xs">✏️</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleTourActive(tour)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          tour.ativo !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                        title="Clique para alternar"
                      >
                        {tour.ativo !== false ? '✅ Ativo' : '⏸ Inativo'}
                      </button>
                    </td>

                    {/* % margem */}
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400">
                      {tour.precoBase > 0
                        ? `${((tour.comissaoPadrao / tour.precoBase) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Promoções de Comissão ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            🔥 Promoções de Comissão
          </h3>
          <button
            onClick={() => setShowCustomModal(true)}
            className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600 transition-colors"
          >
            + Nova Promoção
          </button>
        </div>

        {activePromos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-sm">Nenhuma promoção ativa no momento</p>
            <button onClick={() => setShowCustomModal(true)} className="text-amber-600 hover:underline text-xs mt-1">
              Criar primeira promoção
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activePromos.map(commission => {
              const tour = (tours || []).find(t => t.id === commission.passeioId);
              const daysLeft = commission.dataFim
                ? Math.ceil((commission.dataFim.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={commission.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tour?.nome || commission.passeioId}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-amber-700 dark:text-amber-400 font-medium">{fmt(commission.valor)}</span>
                      {commission.dataFim && (
                        <span className={` • ${daysLeft !== null && daysLeft <= 3 ? 'text-red-500' : ''}`}>
                          {` expira em ${commission.dataFim.toDate().toLocaleDateString('pt-BR')}`}
                          {daysLeft !== null && ` (${daysLeft}d)`}
                        </span>
                      )}
                      {!commission.dataFim && ' • sem prazo'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCustomCommission(commission)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Promoções expiradas (colapsável) */}
        {expiredPromos.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Ver {expiredPromos.length} promoção(ões) expirada(s)
            </summary>
            <div className="mt-2 space-y-1">
              {expiredPromos.map(commission => {
                const tour = (tours || []).find(t => t.id === commission.passeioId);
                return (
                  <div key={commission.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-60">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{tour?.nome || commission.passeioId}</p>
                      <p className="text-xs text-gray-400">
                        {fmt(commission.valor)} • expirou {commission.dataFim?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteCustomCommission(commission)} className="text-red-400 hover:text-red-600 text-xs p-1">🗑️</button>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* ── Modal Novo Passeio ─────────────────────────────────────────────── */}
      {showTourModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowTourModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">🎫 Novo Passeio</h3>
              <button onClick={() => setShowTourModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={tourForm.nome}
                  onChange={e => setTourForm({ ...tourForm, nome: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nome do passeio"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Preço Base (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={tourForm.precoBase}
                    onChange={e => setTourForm({ ...tourForm, precoBase: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Comissão (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={tourForm.comissaoPadrao}
                    onChange={e => setTourForm({ ...tourForm, comissaoPadrao: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              {tourForm.precoBase > 0 && tourForm.comissaoPadrao > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Margem de comissão: {((tourForm.comissaoPadrao / tourForm.precoBase) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowTourModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancelar</button>
              <button onClick={handleCreateTour} disabled={loading || !tourForm.nome.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? '⏳ Criando...' : '🎫 Criar Passeio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nova Promoção ────────────────────────────────────────────── */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowCustomModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">🔥 Nova Promoção</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Passeio <span className="text-red-500">*</span></label>
                <select
                  value={customForm.passeioId}
                  onChange={e => setCustomForm({ ...customForm, passeioId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um passeio</option>
                  {(tours || []).filter(t => t.ativo !== false).map(tour => (
                    <option key={tour.id} value={tour.id}>{tour.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Valor da Comissão Promocional (R$) <span className="text-red-500">*</span></label>
                <input
                  type="number" step="0.01" min="0.01" placeholder="0.00"
                  value={customForm.valor || ''}
                  onChange={e => setCustomForm({ ...customForm, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {customForm.passeioId && customForm.valor > 0 && (() => {
                  const tour = (tours || []).find(t => t.id === customForm.passeioId);
                  if (!tour) return null;
                  const diff = customForm.valor - tour.comissaoPadrao;
                  return (
                    <p className={`text-xs mt-1 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {diff > 0 ? `+${fmt(diff)} em relação ao padrão` : diff < 0 ? `${fmt(diff)} em relação ao padrão` : 'Igual ao padrão'}
                    </p>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data de Início</label>
                  <input
                    type="date"
                    value={customForm.dataInicio}
                    onChange={e => setCustomForm({ ...customForm, dataInicio: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data de Fim</label>
                  <input
                    type="date"
                    value={customForm.dataFim}
                    min={customForm.dataInicio}
                    onChange={e => setCustomForm({ ...customForm, dataFim: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">Sem data de fim = promoção permanente até ser excluída manualmente.</p>
            </div>
            <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancelar</button>
              <button onClick={handleCreateCustomCommission} disabled={loading} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {loading ? '⏳ Criando...' : '🔥 Criar Promoção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
