// src/components/commissions/SalesRegister.tsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import { communicationTourService } from '../../services/communicationTourService';
import { calcularComissaoUnitaria, calcularValorTotal, calcularComissaoTotal, formatCurrency } from '../../utils/commissionCalculations';
import type { Tour, Agency } from '../../types';

interface Props {
  editingSale?: any;
  onCancelEdit?: () => void;
  onSaveSuccess?: () => void;
}

function Counter({ label, value, onChange, min = 1, max, disabled, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors text-lg leading-none">−</button>
        <input type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))}
          className="flex-1 text-center py-2.5 focus:outline-none dark:bg-gray-800 dark:text-white text-sm font-semibold"
          disabled={disabled} />
        <button type="button" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          disabled={disabled || (max !== undefined && value >= max)}
          className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold disabled:opacity-30 transition-colors text-lg leading-none">+</button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function SalesRegister({ editingSale, onCancelEdit, onSaveSuccess }: Props) {
  const { user } = useAuth();
  const { customCommissions, sales, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [tourList, setTourList] = useState<Tour[]>([]);
  const [agencyList, setAgencyList] = useState<Agency[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);

  const [selectedTourId, setSelectedTourId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [currentTourData, setCurrentTourData] = useState<Tour | null>(null);
  const [currentAgencyData, setCurrentAgencyData] = useState<Agency | null>(null);

  const [quantidade, setQuantidade] = useState(1);
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataPasseio, setDataPasseio] = useState(new Date().toISOString().split('T')[0]);
  const [horaPasseio, setHoraPasseio] = useState('09:00');

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<{ cliente: string; passeio: string; comissao: number } | null>(null);
  const [lastCreatedSale, setLastCreatedSale] = useState<any>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);

  // Carregar passeios ativos e agências
  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const snapTours = await getDocs(query(collection(db, 'tours')));
        const list: Tour[] = [];
        snapTours.forEach(d => {
          const data = d.data();
          if (data.ativo === false) return;
          list.push({
            id: d.id, nome: data.nome, descricao: data.descricao,
            precoBase: data.precoBase, comissaoPadrao: data.comissaoPadrao,
            unidade: data.unidade || 'un', tipo: data.tipo,
            tipoPreco: data.tipoPreco || 'por_pessoa',
            capacidadeMaxima: data.capacidadeMaxima || 0,
            agenciaId: data.agenciaId, ativo: data.ativo ?? true,
            createdAt: data.createdAt, createdBy: data.createdBy,
          } as Tour);
        });
        list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setTourList(list);

        const snapAgencies = await getDocs(query(collection(db, 'agencies')));
        const agencies: Agency[] = [];
        snapAgencies.forEach(d => agencies.push({ id: d.id, ...d.data() } as Agency));
        agencies.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setAgencyList(agencies);
      } catch { showToast('Erro ao carregar dados', 'error'); }
      finally { setLoadingList(false); }
    };
    load();
  }, [showToast]);

  // Preencher ao editar
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
      const [date, time] = String(editingSale.dataPasseioRealizacao).split(' ');
      setDataPasseio(date); setHoraPasseio(time || '09:00');
    }
    getDoc(doc(db, 'tours', editingSale.passeioId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setCurrentTourData({ id: snap.id, ...d } as Tour);
      }
    });
  }, [editingSale]);

  // Sincronizar agência
  useEffect(() => {
    setCurrentAgencyData(selectedAgencyId ? agencyList.find(a => a.id === selectedAgencyId) || null : null);
  }, [selectedAgencyId, agencyList]);

  const handleTourChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTourId(id);
    setCurrentTourData(null);
    setQuantidade(1); setQuantidadePessoas(1);
    if (!id) return;
    setLoadingTour(true);
    try {
      const snap = await getDoc(doc(db, 'tours', id));
      if (snap.exists()) setCurrentTourData({ id: snap.id, ...snap.data() } as Tour);
      else showToast('Passeio não encontrado', 'error');
    } catch { showToast('Erro ao carregar detalhes', 'error'); }
    finally { setLoadingTour(false); }
  };

  const resetForm = (keepDate = true) => {
    setSelectedTourId(''); setCurrentTourData(null);
    setSelectedAgencyId(''); setCurrentAgencyData(null);
    setQuantidade(1); setQuantidadePessoas(1);
    setClienteNome(''); setClienteTelefone(''); setObservacoes('');
    if (!keepDate) { setDataPasseio(new Date().toISOString().split('T')[0]); setHoraPasseio('09:00'); }
  };

  // Cálculos
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
    const now = new Date();
    return (customCommissions || []).some(c => c.passeioId === currentTourData.id && (!c.dataFim || c.dataFim.toDate() > now));
  }, [currentTourData, customCommissions]);

  const possibleDuplicate = useMemo(() => {
    if (editingSale || !clienteNome.trim() || !currentTourData || !dataPasseio) return false;
    return (sales || []).some(s => {
      if (s.status !== 'confirmada' || s.passeioId !== currentTourData.id) return false;
      if (s.clienteNome?.toLowerCase().trim() !== clienteNome.toLowerCase().trim()) return false;
      try { return s.dataVenda.toDate().toISOString().split('T')[0] === dataPasseio; } catch { return false; }
    });
  }, [sales, clienteNome, currentTourData, dataPasseio, editingSale]);

  const recentSales = useMemo(() =>
    (sales || [])
      .filter(s => s.vendedorId === user?.id && s.status === 'confirmada')
      .sort((a, b) => { try { return b.dataVenda.toDate().getTime() - a.dataVenda.toDate().getTime(); } catch { return 0; } })
      .slice(0, 5),
    [sales, user]
  );

  const isPorPasseio = currentTourData?.tipoPreco === 'por_passeio';
  const maxPessoas = isPorPasseio && currentTourData?.capacidadeMaxima
    ? currentTourData.capacidadeMaxima * quantidade : undefined;

  const handleSendAgencyReport = async () => {
    const agency = agencyList.find(a => a.id === lastCreatedSale?.agenciaId);
    if (!agency?.telefone) { showToast('Agência sem telefone cadastrado', 'warning'); return; }
    setSendingReport(true);
    try { communicationTourService.sendAgencyReport(lastCreatedSale, agency.telefone); showToast('WhatsApp aberto para agência', 'success'); }
    catch { showToast('Erro ao abrir WhatsApp', 'error'); }
    finally { setSendingReport(false); }
  };

  const handleSendGuestConfirmation = async () => {
    if (!lastCreatedSale?.clienteTelefone) { showToast('Cliente sem telefone cadastrado', 'warning'); return; }
    setSendingConfirmation(true);
    try { communicationTourService.sendGuestConfirmation(lastCreatedSale, lastCreatedSale.clienteTelefone); showToast('WhatsApp aberto para hóspede', 'success'); }
    catch { showToast('Erro ao abrir WhatsApp', 'error'); }
    finally { setSendingConfirmation(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTourData) { showToast('Selecione um passeio', 'warning'); return; }
    if (!clienteNome.trim()) { showToast('Digite o nome do cliente', 'warning'); return; }
    if (!dataPasseio) { showToast('Informe a data do passeio', 'warning'); return; }
    if (possibleDuplicate && !confirm(`Já existe uma venda de "${currentTourData.nome}" para "${clienteNome}" nesta data. Registrar mesmo assim?`)) return;

    setLoading(true);
    try {
      const saleData = {
        dataVenda: editingSale ? editingSale.dataVenda : Timestamp.now(),
        dataPasseioRealizacao: `${dataPasseio} ${horaPasseio}`,
        passeioId: currentTourData.id, passeioNome: currentTourData.nome,
        tipoPreco: currentTourData.tipoPreco,
        precoUnitarioVendido: currentTourData.precoBase,
        quantidade, quantidadePessoas,
        valorTotal: precoTotal, comissaoCalculada: comissaoTotal,
        vendedorId: user?.id, vendedorNome: user?.name || user?.email,
        clienteNome: clienteNome.trim(), clienteTelefone: clienteTelefone.trim(),
        observacoes: observacoes.trim(), status: 'confirmada',
        agenciaId: selectedAgencyId || null, agenciaNome: currentAgencyData?.nome || null,
        updatedAt: Timestamp.now(),
        ...(editingSale ? {} : { createdAt: Timestamp.now() }),
      };

      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        showToast('Venda atualizada', 'success');
        onSaveSuccess?.(); refreshData();
      } else {
        const ref = await addDoc(collection(db, 'sales'), saleData);
        const created = { id: ref.id, ...saleData, tourData: currentTourData, agencyData: currentAgencyData };
        setLastCreatedSale(created);
        setLastSale({ cliente: clienteNome, passeio: currentTourData.nome, comissao: comissaoTotal });
        setShowSuccess(true); setTimeout(() => setShowSuccess(false), 5000);
        resetForm(true); refreshData();
      }
    } catch (err) {
      console.error(err); showToast('Erro ao salvar venda', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Banner de sucesso */}
      {showSuccess && lastSale && !editingSale && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Venda registrada com sucesso</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
              {lastSale.passeio} · {lastSale.cliente} · <strong>+{formatCurrency(lastSale.comissao)} de comissão</strong>
            </p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-400 hover:text-green-600 text-sm">✕</button>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 dark:text-white">{editingSale ? 'Editar venda' : 'Registrar venda'}</h2>
          {editingSale && onCancelEdit && (
            <button onClick={onCancelEdit} className="text-sm text-gray-400 hover:text-red-500 transition-colors">Cancelar</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passeio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Passeio / Transfer <span className="text-red-500">*</span>
            </label>
            <select value={selectedTourId} onChange={handleTourChange} required
              disabled={loadingTour || loadingList}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">{loadingList ? 'Carregando...' : 'Selecione um passeio'}</option>
              {tourList.map(t => (
                <option key={t.id} value={t.id}>{t.nome}{t.tipoPreco === 'por_passeio' ? ' (veículo)' : ''}</option>
              ))}
            </select>

            {/* Info do passeio selecionado */}
            {currentTourData && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {currentTourData.nome}
                    {isPorPasseio && currentTourData.capacidadeMaxima && (
                      <span className="ml-2 text-purple-600 dark:text-purple-400 font-normal">
                        · até {currentTourData.capacidadeMaxima} pessoas/veículo
                      </span>
                    )}
                  </div>
                  {hasPromo && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                      Promoção ativa
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: isPorPasseio ? 'Preço / saída' : 'Preço / pessoa', value: formatCurrency(currentTourData.precoBase), color: 'text-gray-800 dark:text-white' },
                    { label: isPorPasseio ? 'Comissão / saída' : 'Comissão / pessoa', value: formatCurrency(comissaoUnitaria), color: 'text-green-600 dark:text-green-400' },
                    { label: 'Comissão total', value: formatCurrency(comissaoTotal), color: 'text-green-700 dark:text-green-300 text-base' },
                  ].map(item => (
                    <div key={item.label} className="bg-white dark:bg-gray-900 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                      <div className={`font-bold text-sm ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agência */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Agência</label>
            <select value={selectedAgencyId} onChange={e => setSelectedAgencyId(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sem agência (venda direta)</option>
              {agencyList.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            {currentAgencyData?.taxaComissaoPersonalizada != null && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Taxa personalizada de {currentAgencyData.taxaComissaoPersonalizada}% aplicada sobre o preço base.
              </p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Data do passeio <span className="text-red-500">*</span></label>
              <input type="date" value={dataPasseio} onChange={e => setDataPasseio(e.target.value)} required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Horário <span className="text-red-500">*</span></label>
              <input type="time" value={horaPasseio} onChange={e => setHoraPasseio(e.target.value)} required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Quantidades */}
          <div className="grid grid-cols-2 gap-3">
            <Counter label="Qtd de pessoas" value={quantidadePessoas} onChange={setQuantidadePessoas}
              min={1} max={maxPessoas} disabled={!currentTourData}
              hint={isPorPasseio && currentTourData?.capacidadeMaxima ? `Máx ${currentTourData.capacidadeMaxima}/veículo` : undefined} />
            <Counter
              label={isPorPasseio ? 'Qtd de veículos' : 'Qtd de saídas'}
              value={quantidade} onChange={setQuantidade} min={1} disabled={!currentTourData}
              hint={!isPorPasseio ? 'Normalmente 1' : undefined} />
          </div>

          {/* Valor total (readonly) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Valor total</label>
            <input type="text" readOnly value={precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-default" />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Nome do cliente <span className="text-red-500">*</span></label>
            <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} required
              placeholder="Nome completo"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 transition-colors ${possibleDuplicate ? 'border-amber-400 focus:ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`} />
            {possibleDuplicate && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Possível venda duplicada para este passeio e data.</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">WhatsApp</label>
            <input type="tel" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} placeholder="(84) 9 9999-9999"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Informações adicionais..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button type="submit" disabled={loading || loadingTour || !currentTourData || !clienteNome.trim()}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors font-semibold text-sm shadow-sm">
            {loading ? 'Salvando...' : editingSale ? 'Atualizar venda' : `Registrar venda · comissão: ${formatCurrency(comissaoTotal)}`}
          </button>
        </form>
      </div>

      {/* Comunicações pós-venda */}
      {lastCreatedSale && !editingSale && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Enviar comunicações</h3>
          <div className="flex flex-wrap gap-2">
            {lastCreatedSale.agenciaId && (
              <button onClick={handleSendAgencyReport} disabled={sendingReport}
                className="flex-1 min-w-[160px] py-2.5 px-4 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50">
                {sendingReport ? 'Abrindo...' : 'Relatório para agência'}
              </button>
            )}
            {lastCreatedSale.clienteTelefone && (
              <button onClick={handleSendGuestConfirmation} disabled={sendingConfirmation}
                className="flex-1 min-w-[160px] py-2.5 px-4 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                {sendingConfirmation ? 'Abrindo...' : 'Confirmação ao hóspede'}
              </button>
            )}
            <button onClick={() => setLastCreatedSale(null)}
              className="py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Fechar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">O WhatsApp será aberto com a mensagem já preenchida.</p>
        </div>
      )}

      {/* Vendas recentes */}
      {!editingSale && recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Suas vendas recentes</h3>
          <div className="space-y-2">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="min-w-0">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{sale.clienteNome}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs truncate">{sale.passeioNome}</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold whitespace-nowrap ml-3">+{formatCurrency(sale.comissaoCalculada)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}