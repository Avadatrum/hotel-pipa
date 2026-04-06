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
import type { Tour, CustomCommission, TipoPreco } from '../../types';

interface TourFormData {
  nome: string;
  tipoPreco: TipoPreco;
  precoBase: number;
  comissaoPadrao: number;
  capacidadeMaxima?: number;
}

export function CommissionSettings() {
  const { user } = useAuth();
  const { tours, customCommissions, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [globalCommission, setGlobalCommission] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'appSettings', 'commissions'));
        if (snap.exists()) setGlobalCommission(snap.data().valorPadrao || 0);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    load();
  }, []);

  const filteredTours = useMemo(() => {
    let list = tours || [];
    if (!showInactive) list = list.filter(t => t.ativo !== false);
    if (searchTerm.trim())
      list = list.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [tours, showInactive, searchTerm]);

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

  const handleUpdateGlobalCommission = async (value: number) => {
    if (value < 0) { showToast('O valor não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appSettings', 'commissions'), {
        valorPadrao: value,
        updatedBy: user?.id,
        updatedByName: user?.name,
        updatedAt: Timestamp.now(),
      });
      setGlobalCommission(value);
      showToast('Comissão padrão atualizada', 'success');
    } catch {
      showToast('Erro ao atualizar configuração', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTourName = async (tourId: string, newName: string) => {
    if (!newName.trim()) { showToast('O nome não pode ficar vazio', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tourId), {
        nome: newName.trim(),
        updatedBy: user?.id,
        updatedAt: Timestamp.now(),
      });
      showToast('Nome atualizado', 'success');
      refreshData();
    } catch {
      showToast('Erro ao atualizar nome', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTourPrice = async (tourId: string, newPrice: number) => {
    if (newPrice < 0) { showToast('O preço não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tourId), {
        precoBase: newPrice,
        updatedBy: user?.id,
        updatedAt: Timestamp.now(),
      });
      showToast('Preço atualizado', 'success');
      refreshData();
    } catch {
      showToast('Erro ao atualizar preço', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTourCommission = async (tour: Tour, newValue: number) => {
    if (newValue < 0) { showToast('O valor não pode ser negativo', 'warning'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        comissaoPadrao: newValue,
        updatedBy: user?.id,
        updatedAt: Timestamp.now(),
      });
      showToast(`Comissão de "${tour.nome}" atualizada`, 'success');
      refreshData();
    } catch {
      showToast('Erro ao atualizar comissão', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTourActive = async (tour: Tour) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        ativo: tour.ativo === false,
        updatedBy: user?.id,
        updatedAt: Timestamp.now(),
      });
      showToast(tour.ativo === false ? 'Passeio ativado' : 'Passeio desativado', 'success');
      refreshData();
    } catch {
      showToast('Erro ao alterar status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async (data: TourFormData) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'tours'), {
        nome: data.nome.trim(),
        tipoPreco: data.tipoPreco,
        precoBase: data.precoBase,
        comissaoPadrao: data.comissaoPadrao,
        ...(data.tipoPreco === 'por_passeio' && data.capacidadeMaxima
          ? { capacidadeMaxima: data.capacidadeMaxima }
          : {}),
        unidade: data.tipoPreco === 'por_passeio' ? 'saída' : 'pax',
        agenciaId: null,
        ativo: true,
        createdAt: Timestamp.now(),
        createdBy: user?.id,
      });
      showToast('Passeio criado', 'success');
      refreshData();
      setShowTourModal(false);
    } catch {
      showToast('Erro ao criar passeio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async (data: {
    passeioId: string;
    valor: number;
    dataInicio: string;
    dataFim: string;
  }) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'customCommissions'), {
        ...data,
        agenciaId: null,
        dataInicio: Timestamp.fromDate(new Date(data.dataInicio)),
        dataFim: data.dataFim ? Timestamp.fromDate(new Date(data.dataFim)) : null,
        createdAt: Timestamp.now(),
        createdBy: user?.id,
      });
      showToast('Promoção criada', 'success');
      refreshData();
      setShowPromoModal(false);
    } catch {
      showToast('Erro ao criar promoção', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (commission: CustomCommission) => {
    if (!confirm('Excluir esta promoção?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'customCommissions', commission.id));
      showToast('Promoção excluída', 'success');
      refreshData();
    } catch {
      showToast('Erro ao excluir', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlobalCommissionCard
        globalCommission={globalCommission}
        onUpdate={handleUpdateGlobalCommission}
        loading={loading}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            Passeios e transfers cadastrados ({filteredTours.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(s => !s)}
              className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
                showInactive
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
            </button>
            <button
              onClick={() => setShowTourModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              + Novo
            </button>
          </div>
        </div>

        {(tours || []).length > 5 && (
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        )}

        {filteredTours.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhum passeio encontrado</p>
        ) : (
          <ToursTable
            tours={filteredTours}
            loading={loading}
            onUpdateName={handleUpdateTourName}
            onUpdatePrice={handleUpdateTourPrice}
            onUpdateCommission={handleUpdateTourCommission}
            onToggleActive={handleToggleTourActive}
          />
        )}
      </div>

      <PromotionsList
        activePromos={activePromos}
        expiredPromos={expiredPromos}
        tours={tours || []}
        onDelete={handleDeletePromotion}
        onOpenModal={() => setShowPromoModal(true)}
      />

      <TourFormModal
        open={showTourModal}
        loading={loading}
        onClose={() => setShowTourModal(false)}
        onCreate={handleCreateTour}
      />
      <PromotionFormModal
        open={showPromoModal}
        loading={loading}
        tours={tours || []}
        onClose={() => setShowPromoModal(false)}
        onCreate={handleCreatePromotion}
      />
    </div>
  );
}