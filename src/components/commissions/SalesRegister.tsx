// src/pages/commissions/SalesRegister.tsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import { communicationTourService } from '../../services/communicationTourService';
import { calcularComissaoUnitaria, calcularValorTotal, calcularComissaoTotal, formatCurrency } from '../../utils/commissionCalculations';
import type { Tour, Agency } from '../../types';

interface SalesRegisterProps {
  editingSale?: any;
  onCancelEdit?: () => void;
  onSaveSuccess?: () => void;
}

export function SalesRegister({ editingSale, onCancelEdit, onSaveSuccess }: SalesRegisterProps) {
  const { user } = useAuth();
  const { customCommissions, sales, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [tourList, setTourList] = useState<Tour[]>([]);
  const [agencyList, setAgencyList] = useState<Agency[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedTourId, setSelectedTourId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [currentTourData, setCurrentTourData] = useState<Tour | null>(null);
  const [currentAgencyData, setCurrentAgencyData] = useState<Agency | null>(null);

  const [quantidade, setQuantidade] = useState(1);       // saídas / veículos
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataPasseio, setDataPasseio] = useState(new Date().toISOString().split('T')[0]);
  const [horaPasseio, setHoraPasseio] = useState('09:00');

  const [loading, setLoading] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<{ cliente: string; passeio: string; comissao: number } | null>(null);
  const [lastCreatedSale, setLastCreatedSale] = useState<any>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);

  // Carregar passeios e agências
  useEffect(() => {
    const loadData = async () => {
      setLoadingList(true);
      try {
        const snapTours = await getDocs(query(collection(db, 'tours')));
        const listTours: Tour[] = [];
        snapTours.forEach(d => {
          const data = d.data();
          if (data.ativo === false) return; // Exibe apenas ativos
          listTours.push({
            id: d.id,
            nome: data.nome,
            precoBase: data.precoBase,
            comissaoPadrao: data.comissaoPadrao,
            unidade: data.unidade || 'un',
            tipo: data.tipo,
            tipoPreco: data.tipoPreco || 'por_pessoa',
            capacidadeMaxima: data.capacidadeMaxima || 0,
            agenciaId: data.agenciaId,
            ativo: data.ativo ?? true,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
          } as Tour);
        });
        listTours.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setTourList(listTours);

        const snapAgencies = await getDocs(query(collection(db, 'agencies')));
        const listAgencies: Agency[] = [];
        snapAgencies.forEach(d => listAgencies.push({ id: d.id, ...d.data() } as Agency));
        listAgencies.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setAgencyList(listAgencies);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados iniciais', 'error');
      } finally {
        setLoadingList(false);
      }
    };
    loadData();
  }, [showToast]);

  // Preencher formulário em modo de edição
  useEffect(() => {
    if (!editingSale) return;
    setSelectedTourId(editingSale.passeioId);
    setClienteNome(editingSale.clienteNome || '');
    setClienteTelefone(editingSale.clienteTelefone || '');
    setQuantidade(editingSale.quantidade || 1);
    setQuantidadePessoas(editingSale.quantidadePessoas || 1);
    setObservacoes(editingSale.observacoes || '');
    setSelectedAgencyId(editingSale.agenciaId || '');
    if (editingSale.dataPasseioRealizacao) {
      const [date, time] = editingSale.dataPasseioRealizacao.split(' ');
      setDataPasseio(date);
      setHoraPasseio(time || '09:00');
    }
    const loadTourForEdit = async () => {
      try {
        const tourSnap = await getDoc(doc(db, 'tours', editingSale.passeioId));
        if (tourSnap.exists()) {
          const data = tourSnap.data();
          setCurrentTourData({
            id: tourSnap.id,
            nome: data.nome,
            precoBase: data.precoBase,
            comissaoPadrao: data.comissaoPadrao,
            unidade: data.unidade || 'un',
            tipo: data.tipo,
            tipoPreco: data.tipoPreco || 'por_pessoa',
            capacidadeMaxima: data.capacidadeMaxima || 0,
            agenciaId: data.agenciaId,
            ativo: data.ativo ?? true,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
          } as Tour);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTourForEdit();
  }, [editingSale]);

  // Sincronizar agência selecionada
  useEffect(() => {
    if (selectedAgencyId) {
      setCurrentAgencyData(agencyList.find(a => a.id === selectedAgencyId) || null);
    } else {
      setCurrentAgencyData(null);
    }
  }, [selectedAgencyId, agencyList]);

  const handleTourChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTourId(id);
    setCurrentTourData(null);
    setQuantidade(1);
    setQuantidadePessoas(1);
    if (!id) return;
    setLoadingTour(true);
    try {
      const tourSnap = await getDoc(doc(db, 'tours', id));
      if (tourSnap.exists()) {
        const data = tourSnap.data();
        setCurrentTourData({
          id: tourSnap.id,
          nome: data.nome,
          precoBase: data.precoBase,
          comissaoPadrao: data.comissaoPadrao,
          unidade: data.unidade || 'un',
          tipo: data.tipo,
          tipoPreco: data.tipoPreco || 'por_pessoa',
          capacidadeMaxima: data.capacidadeMaxima || 0,
          agenciaId: data.agenciaId,
          ativo: data.ativo ?? true,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
        } as Tour);
      } else {
        showToast('Passeio não encontrado', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Erro ao carregar detalhes', 'error');
    } finally {
      setLoadingTour(false);
    }
  };

  const resetForm = (keepDateHour = true) => {
    setSelectedTourId('');
    setCurrentTourData(null);
    setSelectedAgencyId('');
    setCurrentAgencyData(null);
    setQuantidade(1);
    setQuantidadePessoas(1);
    setClienteNome('');
    setClienteTelefone('');
    setObservacoes('');
    if (!keepDateHour) {
      setDataPasseio(new Date().toISOString().split('T')[0]);
      setHoraPasseio('09:00');
    }
  };

  // Cálculos derivados
  const comissaoUnitaria = useMemo(() => {
    if (!currentTourData) return 0;
    return calcularComissaoUnitaria(currentTourData, currentAgencyData, customCommissions || []);
  }, [currentTourData, currentAgencyData, customCommissions]);

  const precoTotal = useMemo(() => {
    if (!currentTourData) return 0;
    return calcularValorTotal(currentTourData, quantidade, quantidadePessoas);
  }, [currentTourData, quantidade, quantidadePessoas]);

  const comissaoTotal = useMemo(() => {
    if (!currentTourData) return 0;
    return calcularComissaoTotal(comissaoUnitaria, currentTourData, quantidade, quantidadePessoas);
  }, [comissaoUnitaria, currentTourData, quantidade, quantidadePessoas]);

  const hasPromo = useMemo(() => {
    if (!currentTourData) return false;
    const agora = new Date();
    return (customCommissions || []).some(
      c => c.passeioId === currentTourData.id && (!c.dataFim || c.dataFim.toDate() > agora)
    );
  }, [currentTourData, customCommissions]);

  const possibleDuplicate = useMemo(() => {
    if (editingSale || !clienteNome.trim() || !currentTourData || !dataPasseio) return false;
    return (sales || []).some(s => {
      if (s.status !== 'confirmada' || s.passeioId !== currentTourData.id) return false;
      if (s.clienteNome?.toLowerCase().trim() !== clienteNome.toLowerCase().trim()) return false;
      try {
        return s.dataVenda.toDate().toISOString().split('T')[0] === dataPasseio;
      } catch {
        return false;
      }
    });
  }, [sales, clienteNome, currentTourData, dataPasseio, editingSale]);

  const recentSales = useMemo(() => {
    return (sales || [])
      .filter(s => s.vendedorId === user?.id && s.status === 'confirmada')
      .sort((a, b) => {
        try { return b.dataVenda.toDate().getTime() - a.dataVenda.toDate().getTime(); }
        catch { return 0; }
      })
      .slice(0, 5);
  }, [sales, user]);

  const handleSendAgencyReport = async () => {
    if (!lastCreatedSale?.agenciaId) {
      showToast('Esta venda não está associada a nenhuma agência', 'warning');
      return;
    }
    const agency = agencyList.find(a => a.id === lastCreatedSale.agenciaId);
    if (!agency?.telefone) {
      showToast('Agência não possui telefone cadastrado', 'warning');
      return;
    }
    setSendingReport(true);
    try {
      communicationTourService.sendAgencyReport(lastCreatedSale, agency.telefone);
      showToast('Relatório enviado para a agência', 'success');
    } catch {
      showToast('Erro ao enviar relatório', 'error');
    } finally {
      setSendingReport(false);
    }
  };

  const handleSendGuestConfirmation = async () => {
    if (!lastCreatedSale?.clienteTelefone) {
      showToast('Cliente não possui telefone cadastrado', 'warning');
      return;
    }
    setSendingConfirmation(true);
    try {
      communicationTourService.sendGuestConfirmation(lastCreatedSale, lastCreatedSale.clienteTelefone);
      showToast('Confirmação enviada para o hóspede', 'success');
    } catch {
      showToast('Erro ao enviar confirmação', 'error');
    } finally {
      setSendingConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTourData) { showToast('Selecione um passeio válido', 'warning'); return; }
    if (!clienteNome.trim()) { showToast('Digite o nome do cliente', 'warning'); return; }
    if (!dataPasseio) { showToast('Informe a data do passeio', 'warning'); return; }
    if (possibleDuplicate) {
      if (!confirm(`Atenção: já existe uma venda de "${currentTourData.nome}" para "${clienteNome}" nesta data.\n\nDeseja registrar mesmo assim?`)) return;
    }
    setLoading(true);
    try {
      const dataHoraFormatada = `${dataPasseio} ${horaPasseio}`;
      const saleData = {
        dataVenda: editingSale ? editingSale.dataVenda : Timestamp.now(),
        dataPasseioRealizacao: dataHoraFormatada,
        passeioId: currentTourData.id,
        passeioNome: currentTourData.nome,
        tipoPreco: currentTourData.tipoPreco,
        precoUnitarioVendido: currentTourData.precoBase,
        quantidade,
        quantidadePessoas,
        valorTotal: precoTotal,
        comissaoCalculada: comissaoTotal,
        vendedorId: user?.id,
        vendedorNome: user?.name || user?.email,
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        observacoes: observacoes.trim(),
        status: 'confirmada',
        agenciaId: selectedAgencyId || null,
        agenciaNome: currentAgencyData?.nome || null,
        updatedAt: Timestamp.now(),
        ...(editingSale ? {} : { createdAt: Timestamp.now() }),
      };

      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        showToast('Venda atualizada com sucesso', 'success');
        onSaveSuccess?.();
        refreshData();
      } else {
        const docRef = await addDoc(collection(db, 'sales'), saleData);
        const createdSale = {
          id: docRef.id,
          ...saleData,
          tourData: currentTourData,
          agencyData: currentAgencyData,
        };
        setLastCreatedSale(createdSale);
        setLastSale({ cliente: clienteNome, passeio: currentTourData.nome, comissao: comissaoTotal });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        resetForm(true);
        refreshData();
        showToast('Venda registrada. Use os botões abaixo para enviar comunicações.', 'success');
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      showToast('Erro ao salvar venda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPorPasseio = currentTourData?.tipoPreco === 'por_passeio';

  return (
    <div className="space-y-5">
      {/* Banner de sucesso */}
      {showSuccess && lastSale && !editingSale && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-green-700 dark:text-green-400">
              Venda registrada com sucesso
            </div>
            <div className="text-sm text-green-600 dark:text-green-500 mt-0.5">
              {lastSale.passeio} — {lastSale.cliente} —{' '}
              <span className="font-bold">+{formatCurrency(lastSale.comissao)} de comissão</span>
            </div>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-400 hover:text-green-600">
            ✕
          </button>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {editingSale ? 'Editar venda' : 'Registrar venda'}
          </h2>
          {editingSale && onCancelEdit && (
            <button onClick={onCancelEdit} className="text-sm text-gray-500 hover:text-red-500">
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passeio */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Passeio / Transfer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedTourId}
                onChange={handleTourChange}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none pr-10"
                required
                disabled={loadingTour || loadingList}
              >
                <option value="">
                  {loadingList ? 'Carregando...' : 'Selecione um passeio'}
                </option>
                {tourList.map(tour => (
                  <option key={tour.id} value={tour.id}>
                    {tour.nome}{tour.tipoPreco === 'por_passeio' ? ' (veículo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Painel de info do passeio selecionado */}
            {currentTourData && (
              <div className="mt-2.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {currentTourData.nome}
                    {isPorPasseio && (
                      <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-400">
                        cobrança por veículo
                        {currentTourData.capacidadeMaxima
                          ? ` · até ${currentTourData.capacidadeMaxima} pessoas`
                          : ''}
                      </span>
                    )}
                  </span>
                  {hasPromo && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      Promoção ativa
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Preço {isPorPasseio ? 'por saída' : 'por pessoa'}
                    </div>
                    <div className="font-semibold text-gray-800 dark:text-white text-sm">
                      {formatCurrency(currentTourData.precoBase)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Comissão {isPorPasseio ? 'por saída' : 'por pessoa'}
                    </div>
                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">
                      {formatCurrency(comissaoUnitaria)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">Comissão total</div>
                    <div className="font-bold text-green-700 dark:text-green-300 text-sm">
                      {formatCurrency(comissaoTotal)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Agência */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Agência
            </label>
            <select
              value={selectedAgencyId}
              onChange={e => setSelectedAgencyId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Sem agência (venda direta)</option>
              {agencyList.map(agency => (
                <option key={agency.id} value={agency.id}>{agency.nome}</option>
              ))}
            </select>
            {selectedAgencyId && currentAgencyData?.taxaComissaoPersonalizada != null && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Taxa personalizada de {currentAgencyData.taxaComissaoPersonalizada}% aplicada sobre o preço base.
              </p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Data do passeio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataPasseio}
                onChange={e => setDataPasseio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Horário <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaPasseio}
                onChange={e => setHoraPasseio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Quantidades */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantidade de pessoas — sempre visível */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Quantidade de pessoas <span className="text-red-500">*</span>
              </label>
              <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas(q => Math.max(1, q - 1))}
                  disabled={!currentTourData || quantidadePessoas <= 1}
                  className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={isPorPasseio && currentTourData?.capacidadeMaxima ? currentTourData.capacidadeMaxima * quantidade : undefined}
                  value={quantidadePessoas}
                  onChange={e => setQuantidadePessoas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center border-x dark:border-gray-600 py-2.5 focus:outline-none dark:bg-gray-700 dark:text-white"
                  required
                  disabled={!currentTourData}
                />
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas(q => q + 1)}
                  disabled={
                    !currentTourData ||
                    (isPorPasseio && currentTourData?.capacidadeMaxima
                      ? quantidadePessoas >= currentTourData.capacidadeMaxima * quantidade
                      : false)
                  }
                  className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
              {isPorPasseio && currentTourData?.capacidadeMaxima && (
                <p className="text-xs text-gray-500 mt-1">
                  Capacidade máxima: {currentTourData.capacidadeMaxima} por veículo
                </p>
              )}
            </div>

            {/* Quantidade de saídas — sempre visível */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                {isPorPasseio ? 'Quantidade de veículos' : 'Quantidade de saídas'}
              </label>
              <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                  disabled={!currentTourData || quantidade <= 1}
                  className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center border-x dark:border-gray-600 py-2.5 focus:outline-none dark:bg-gray-700 dark:text-white"
                  required
                  disabled={!currentTourData}
                />
                <button
                  type="button"
                  onClick={() => setQuantidade(q => q + 1)}
                  disabled={!currentTourData}
                  className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
              {!isPorPasseio && (
                <p className="text-xs text-gray-500 mt-1">
                  Normalmente 1 — use mais se o grupo sair em datas diferentes.
                </p>
              )}
            </div>
          </div>

          {/* Valor total (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Valor total da venda
            </label>
            <input
              type="text"
              value={precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              readOnly
              className="w-full border rounded-lg px-3 py-2.5 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-200 cursor-default"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Nome do cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-colors ${
                possibleDuplicate
                  ? 'border-amber-400 focus:ring-amber-400 bg-amber-50 dark:bg-amber-900/10'
                  : 'focus:ring-blue-500 dark:border-gray-600'
              }`}
              placeholder="Nome completo do cliente"
              required
            />
            {possibleDuplicate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Possível venda duplicada para este passeio e data.
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={clienteTelefone}
              onChange={e => setClienteTelefone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="(84) 9 9999-9999"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              placeholder="Informações adicionais..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || loadingTour || !currentTourData || !clienteNome.trim()}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors font-bold flex justify-center items-center gap-2 text-base shadow-sm"
          >
            {loading
              ? 'Salvando...'
              : editingSale
              ? 'Atualizar venda'
              : `Registrar venda — comissão: ${formatCurrency(comissaoTotal)}`}
          </button>
        </form>
      </div>

      {/* Botões de comunicação pós-venda */}
      {lastCreatedSale && !editingSale && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
            Comunicações da venda
          </h3>
          <div className="flex flex-wrap gap-3">
            {lastCreatedSale.agenciaId && (
              <button
                onClick={handleSendAgencyReport}
                disabled={sendingReport}
                className="flex-1 min-w-[150px] bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {sendingReport ? 'Abrindo WhatsApp...' : 'Enviar relatório para agência'}
              </button>
            )}
            {lastCreatedSale.clienteTelefone && (
              <button
                onClick={handleSendGuestConfirmation}
                disabled={sendingConfirmation}
                className="flex-1 min-w-[150px] bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {sendingConfirmation ? 'Abrindo WhatsApp...' : 'Enviar confirmação ao hóspede'}
              </button>
            )}
            <button
              onClick={() => setLastCreatedSale(null)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Clique nos botões acima para abrir o WhatsApp com a mensagem já preenchida.
          </p>
        </div>
      )}

      {/* Vendas recentes */}
      {!editingSale && recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Suas vendas recentes
          </h3>
          <div className="space-y-2">
            {recentSales.map(sale => (
              <div
                key={sale.id}
                className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{sale.clienteNome}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{sale.passeioNome}</span>
                  {sale.quantidadePessoas > 1 && (
                    <span className="text-gray-400 text-xs ml-1">({sale.quantidadePessoas} pessoas)</span>
                  )}
                </div>
                <span className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                  +{formatCurrency(sale.comissaoCalculada)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}