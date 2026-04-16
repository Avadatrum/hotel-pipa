// src/pages/commissions/CommissionSettings.tsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, getDoc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useCommissions } from '../../contexts/CommissionContext';
import { GlobalCommissionCard } from '../../components/commissions/GlobalCommissionCard';
import { ToursTable } from '../../components/commissions/ToursTable';
import { PromotionsList } from '../../components/commissions/PromotionsList';
import { TourFormModal } from '../../components/commissions/TourFormModal';
import { PromotionFormModal } from '../../components/commissions/PromotionFormModal';
import { SendTourPromoModal } from '../../components/commissions/SendTourPromoModal';
import { TourDetailModal } from '../../components/commissions/TourDetailModal';
import type { Tour, CustomCommission, TipoPreco } from '../../types';

interface TourFormData {
  nome: string; descricao: string; tipoPreco: TipoPreco;
  precoBase: number; comissaoPadrao: number; capacidadeMaxima?: number;
}

export function CommissionSettings() {
  const { user } = useAuth();
  const { tours, customCommissions, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [globalCommission, setGlobalCommission] = useState(0);
  const [numeroRecepcionistas, setNumeroRecepcionistas] = useState(4);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTour, setPromoTour] = useState<Tour | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null); // ✅ Único estado necessário

  // Carregar configurações
  useEffect(() => {
    getDoc(doc(db, 'appSettings', 'commissions')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalCommission(data.valorPadrao || 0);
        setNumeroRecepcionistas(data.numeroRecepcionistas || 4);
      }
    });
  }, []);

  const filteredTours = useMemo(() => {
    let list = (tours || []);
    list = list.filter(t => showInactive ? t.ativo === false : t.ativo !== false);
    if (searchTerm.trim())
      list = list.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [tours, showInactive, searchTerm]);

  const { activePromos, expiredPromos } = useMemo(() => {
    const now = new Date();
    const active: CustomCommission[] = [], expired: CustomCommission[] = [];
    (customCommissions || []).forEach(c =>
      (!c.dataFim || c.dataFim.toDate() > now ? active : expired).push(c)
    );
    return { activePromos: active, expiredPromos: expired };
  }, [customCommissions]);

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } catch { showToast('Erro ao salvar', 'error'); } finally { setLoading(false); }
  };

  const handleUpdateGlobalCommission = (value: number) => withLoad(async () => {
    if (value < 0) { showToast('Valor não pode ser negativo', 'warning'); return; }
    await updateDoc(doc(db, 'appSettings', 'commissions'), { 
      valorPadrao: value, 
      updatedBy: user?.id, 
      updatedAt: Timestamp.now() 
    });
    setGlobalCommission(value);
    showToast('Comissão padrão atualizada', 'success');
  });

  const handleUpdateNumeroRecepcionistas = (value: number) => withLoad(async () => {
    if (value < 1 || value > 10) { showToast('Número deve ser entre 1 e 10', 'warning'); return; }
    await updateDoc(doc(db, 'appSettings', 'commissions'), { 
      numeroRecepcionistas: value, 
      updatedBy: user?.id, 
      updatedAt: Timestamp.now() 
    });
    setNumeroRecepcionistas(value);
    showToast('Número de recepcionistas atualizado', 'success');
  });

  const handleUpdateTourName = (tourId: string, newName: string) => withLoad(async () => {
    if (!newName.trim()) { showToast('Nome não pode ficar vazio', 'warning'); return; }
    await updateDoc(doc(db, 'tours', tourId), { nome: newName.trim(), updatedBy: user?.id, updatedAt: Timestamp.now() });
    showToast('Nome atualizado', 'success'); refreshData();
  });

  const handleUpdateTourPrice = (tourId: string, price: number) => withLoad(async () => {
    if (price < 0) { showToast('Preço não pode ser negativo', 'warning'); return; }
    await updateDoc(doc(db, 'tours', tourId), { precoBase: price, updatedBy: user?.id, updatedAt: Timestamp.now() });
    showToast('Preço atualizado', 'success'); refreshData();
  });

  const handleUpdateTourCommission = (tour: Tour, value: number) => withLoad(async () => {
    if (value < 0) { showToast('Valor não pode ser negativo', 'warning'); return; }
    await updateDoc(doc(db, 'tours', tour.id), { comissaoPadrao: value, updatedBy: user?.id, updatedAt: Timestamp.now() });
    showToast(`Comissão de "${tour.nome}" atualizada`, 'success'); refreshData();
  });

  const handleToggleTourActive = (tour: Tour) => withLoad(async () => {
    const novoStatus = tour.ativo === false;
    await updateDoc(doc(db, 'tours', tour.id), { ativo: novoStatus, updatedBy: user?.id, updatedAt: Timestamp.now() });
    showToast(novoStatus ? 'Passeio ativado' : 'Passeio desativado', 'success'); refreshData();
  });

  const handleDeleteTour = async (tour: Tour) => {
    if (tour.ativo !== false) {
      showToast('Apenas passeios inativos podem ser excluídos', 'warning');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir permanentemente "${tour.nome}"?\n\nEsta ação não pode ser desfeita.`)) return;
    
    withLoad(async () => {
      await deleteDoc(doc(db, 'tours', tour.id));
      showToast('Passeio excluído com sucesso', 'success');
      refreshData();
    });
  };

  const handleCreateTour = async (data: TourFormData) => withLoad(async () => {
    await addDoc(collection(db, 'tours'), {
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      tipoPreco: data.tipoPreco,
      precoBase: data.precoBase,
      comissaoPadrao: data.comissaoPadrao,
      ...(data.tipoPreco === 'por_passeio' && data.capacidadeMaxima ? { capacidadeMaxima: data.capacidadeMaxima } : {}),
      unidade: data.tipoPreco === 'por_passeio' ? 'saída' : 'pax',
      agenciaId: null, ativo: true,
      fotos: [],
      createdAt: Timestamp.now(), createdBy: user?.id,
    });
    showToast('Passeio criado', 'success'); refreshData(); setShowTourModal(false);
  });

  const handleCreatePromotion = async (data: { passeioId: string; valor: number; dataInicio: string; dataFim: string }) => withLoad(async () => {
    await addDoc(collection(db, 'customCommissions'), {
      ...data, agenciaId: null,
      dataInicio: Timestamp.fromDate(new Date(data.dataInicio)),
      dataFim: data.dataFim ? Timestamp.fromDate(new Date(data.dataFim)) : null,
      createdAt: Timestamp.now(), createdBy: user?.id,
    });
    showToast('Promoção criada', 'success'); refreshData(); setShowPromoModal(false);
  });

  const handleDeletePromotion = async (commission: CustomCommission) => {
    if (!confirm('Excluir esta promoção?')) return;
    withLoad(async () => {
      await deleteDoc(doc(db, 'customCommissions', commission.id));
      showToast('Promoção excluída', 'success'); refreshData();
    });
  };

  const totalAtivos = (tours || []).filter(t => t.ativo !== false).length;
  const totalInativos = (tours || []).filter(t => t.ativo === false).length;

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlobalCommissionCard 
          globalCommission={globalCommission} 
          onUpdate={handleUpdateGlobalCommission} 
          loading={loading} 
        />
        
        {/* Card de número de recepcionistas */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
              👥 Número de Recepcionistas
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              Define em quantas partes iguais a comissão será dividida.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateNumeroRecepcionistas(Math.max(1, numeroRecepcionistas - 1))}
                className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xl hover:bg-purple-200 transition-colors"
              >
                −
              </button>
              <div className="text-center min-w-[60px]">
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{numeroRecepcionistas}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">pessoas</p>
              </div>
              <button
                onClick={() => handleUpdateNumeroRecepcionistas(Math.min(10, numeroRecepcionistas + 1))}
                className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xl hover:bg-purple-200 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Cada recepcionista recebe 1/{numeroRecepcionistas} do total
            </p>
          </div>
        </div>
      </div>

      {/* Passeios e Transfers */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Passeios e transfers</h3>
              <p className="text-xs text-gray-500 mt-0.5">{totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''} · {totalInativos} inativo{totalInativos !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button onClick={() => setShowInactive(false)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!showInactive ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                  Ativos
                </button>
                <button onClick={() => setShowInactive(true)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showInactive ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                  Inativos
                </button>
              </div>
              <button onClick={() => setShowTourModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                + Novo
              </button>
            </div>
          </div>

          {(tours || []).length > 4 && (
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="mt-3 w-full sm:w-64 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>

        <div className="p-4">
          <ToursTable 
            tours={filteredTours} 
            loading={loading}
            onUpdateName={handleUpdateTourName} 
            onUpdatePrice={handleUpdateTourPrice}
            onUpdateCommission={handleUpdateTourCommission} 
            onToggleActive={handleToggleTourActive}
            onSendPromo={setPromoTour}
            onEditDetails={setSelectedTour} // ✅ Simplificado
            onDelete={handleDeleteTour}
          />
        </div>
      </div>

      <PromotionsList 
        activePromos={activePromos} 
        expiredPromos={expiredPromos}
        tours={tours || []} 
        onDelete={handleDeletePromotion} 
        onOpenModal={() => setShowPromoModal(true)} 
      />

      {/* Modais */}
      <TourFormModal open={showTourModal} loading={loading} onClose={() => setShowTourModal(false)} onCreate={handleCreateTour} />
      <PromotionFormModal open={showPromoModal} loading={loading} tours={tours || []} onClose={() => setShowPromoModal(false)} onCreate={handleCreatePromotion} />
      <SendTourPromoModal tour={promoTour} onClose={() => setPromoTour(null)} />
      
      {/* Modal de detalhes/galeria - controlado apenas por selectedTour */}
      {selectedTour && (
        <TourDetailModal 
          tour={selectedTour}
          onClose={() => setSelectedTour(null)}
          onUpdate={refreshData}
        />
      )}
    </div>
  );
}