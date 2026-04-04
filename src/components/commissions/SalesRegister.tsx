// src/components/commissions/SalesRegister.tsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import type { Tour } from '../../types';

export function SalesRegister() {
  const { user } = useAuth();
  const { customCommissions, sales, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [tourList, setTourList] = useState<Tour[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [currentTourData, setCurrentTourData] = useState<Tour | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataPasseio, setDataPasseio] = useState(new Date().toISOString().split('T')[0]);
  const [horaPasseio, setHoraPasseio] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [precoTotal, setPrecoTotal] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<{ cliente: string; passeio: string; comissao: number } | null>(null);

  // Comissão efetiva calculada
  const comissaoUnitaria = useMemo(() => {
    if (!currentTourData) return 0;
    const agora = new Date();
    const promo = customCommissions?.find(c =>
      c.passeioId === currentTourData.id &&
      (!c.dataFim || c.dataFim.toDate() > agora)
    );
    return promo ? promo.valor : currentTourData.comissaoPadrao;
  }, [currentTourData, customCommissions]);

  const comissaoTotal = comissaoUnitaria * quantidade;

  // Detecta se já existe venda para o mesmo cliente + passeio no mesmo dia
  const possibleDuplicate = useMemo(() => {
    if (!clienteNome.trim() || !currentTourData || !dataPasseio) return false;
    return (sales || []).some(s =>
      s.status === 'confirmada' &&
      s.passeioId === currentTourData.id &&
      s.clienteNome?.toLowerCase().trim() === clienteNome.toLowerCase().trim() &&
      (() => {
        try {
          const d = s.dataVenda.toDate();
          return d.toISOString().split('T')[0] === dataPasseio;
        } catch { return false; }
      })()
    );
  }, [sales, clienteNome, currentTourData, dataPasseio]);

  // Vendas recentes do usuário (últimas 5)
  const recentSales = useMemo(() => {
    return (sales || [])
      .filter(s => s.vendedorId === user?.id && s.status === 'confirmada')
      .sort((a, b) => {
        try { return b.dataVenda.toDate().getTime() - a.dataVenda.toDate().getTime(); }
        catch { return 0; }
      })
      .slice(0, 5);
  }, [sales, user]);

  useEffect(() => {
    const loadTours = async () => {
      setLoadingList(true);
      try {
        const q = query(collection(db, 'tours'));
        const snap = await getDocs(q);
        const list: Tour[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as Tour));
        // Ordena por nome
        list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setTourList(list);
      } catch (error) {
        console.error('Erro ao carregar lista de passeios:', error);
        showToast('Erro ao carregar passeios', 'error');
      } finally {
        setLoadingList(false);
      }
    };
    loadTours();
  }, [showToast]);

  useEffect(() => {
    if (currentTourData) {
      setPrecoTotal(currentTourData.precoBase * quantidade);
    } else {
      setPrecoTotal(0);
    }
  }, [currentTourData, quantidade]);

  const handleTourChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTourId(id);
    if (!id) {
      setCurrentTourData(null);
      setPrecoTotal(0);
      return;
    }
    setLoadingTour(true);
    setCurrentTourData(null);
    setQuantidade(1);
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
          agenciaId: data.agenciaId,
          ativo: data.ativo ?? true,
          createdAt: data.createdAt,
          createdBy: data.createdBy
        } as Tour);
      } else {
        showToast('Passeio não encontrado.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do passeio:', error);
      showToast('Erro ao carregar detalhes.', 'error');
    } finally {
      setLoadingTour(false);
    }
  };

  const resetForm = (keepDateHour = true) => {
    setSelectedTourId('');
    setCurrentTourData(null);
    setQuantidade(1);
    setClienteNome('');
    setClienteTelefone('');
    setObservacoes('');
    setPrecoTotal(0);
    if (!keepDateHour) {
      setDataPasseio(new Date().toISOString().split('T')[0]);
      setHoraPasseio('09:00');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTourData) { showToast('Selecione um passeio válido', 'warning'); return; }
    if (!clienteNome.trim()) { showToast('Digite o nome do cliente', 'warning'); return; }
    if (!dataPasseio) { showToast('Informe a data do passeio', 'warning'); return; }

    if (possibleDuplicate) {
      if (!confirm(`⚠️ Atenção: já existe uma venda de "${currentTourData.nome}" para "${clienteNome}" nesta data.\n\nDeseja registrar mesmo assim?`)) return;
    }

    setLoading(true);
    try {
      const dataHoraPasseioFormatada = `${dataPasseio} ${horaPasseio}`;
      const saleData = {
        dataVenda: Timestamp.now(),
        dataPasseioRealizacao: dataHoraPasseioFormatada,
        passeioId: currentTourData.id,
        passeioNome: currentTourData.nome,
        quantidade,
        precoUnitarioVendido: currentTourData.precoBase,
        valorTotal: precoTotal,
        comissaoCalculada: comissaoTotal,
        vendedorId: user?.id,
        vendedorNome: user?.name || user?.email,
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        observacoes: observacoes.trim(),
        status: 'confirmada',
        createdAt: Timestamp.now(),
        canceledAt: null,
        canceledBy: null
      };

      await addDoc(collection(db, 'sales'), saleData);

      setLastSale({ cliente: clienteNome, passeio: currentTourData.nome, comissao: comissaoTotal });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      resetForm(true); // Mantém data/hora para facilitar múltiplas vendas do mesmo grupo
      refreshData();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      showToast('❌ Erro ao registrar venda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasPromo = useMemo(() => {
    if (!currentTourData) return false;
    const agora = new Date();
    return (customCommissions || []).some(c =>
      c.passeioId === currentTourData.id &&
      (!c.dataFim || c.dataFim.toDate() > agora)
    );
  }, [currentTourData, customCommissions]);

  return (
    <div className="space-y-5">
      {/* Banner de sucesso */}
      {showSuccess && lastSale && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-start gap-3 animate-pulse">
          <div className="text-2xl">🎉</div>
          <div>
            <div className="font-semibold text-green-700 dark:text-green-400">Venda registrada com sucesso!</div>
            <div className="text-sm text-green-600 dark:text-green-500">
              {lastSale.passeio} — {lastSale.cliente} —{' '}
              <span className="font-bold">
                +R$ {lastSale.comissao.toFixed(2)} de comissão
              </span>
            </div>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-white flex items-center gap-2">
          📝 Registrar Venda de Passeio
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do passeio */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Passeio <span className="text-red-500">*</span>
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
                  {loadingList ? 'Carregando passeios...' : 'Selecione um passeio'}
                </option>
                {tourList.map(tour => (
                  <option key={tour.id} value={tour.id}>{tour.nome}</option>
                ))}
              </select>
              {(loadingTour || loadingList) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin">⏳</div>
              )}
            </div>

            {/* Detalhes do passeio selecionado */}
            {currentTourData && (
              <div className="mt-2.5 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                    {currentTourData.nome}
                  </span>
                  {hasPromo && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      🔥 Promoção ativa
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">Preço</div>
                    <div className="font-semibold text-gray-800 dark:text-white text-sm">
                      R$ {currentTourData.precoBase.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">Comissão/un.</div>
                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">
                      R$ {comissaoUnitaria.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-0.5">Total {quantidade > 1 ? `(x${quantidade})` : ''}</div>
                    <div className="font-bold text-green-700 dark:text-green-300 text-sm">
                      R$ {comissaoTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data e hora do passeio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Data do Passeio <span className="text-red-500">*</span>
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

          {/* Quantidade e valor total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Quantidade <span className="text-red-500">*</span>
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Valor Total da Venda
              </label>
              <input
                type="text"
                value={precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                readOnly
                className="w-full border rounded-lg px-3 py-2.5 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-200 cursor-default"
              />
            </div>
          </div>

          {/* Nome do cliente */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Nome do Cliente <span className="text-red-500">*</span>
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
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                ⚠️ Possível venda duplicada: já existe registro deste cliente para este passeio nesta data.
              </p>
            )}
          </div>

          {/* Telefone do cliente */}
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
              placeholder="Informações adicionais sobre a venda..."
            />
          </div>

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={loading || loadingTour || !currentTourData || !clienteNome.trim()}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors font-bold flex justify-center items-center gap-2 text-base shadow-sm"
          >
            {loading ? (
              <><span className="animate-spin inline-block">⏳</span> Registrando...</>
            ) : (
              <>💰 Registrar Venda{currentTourData ? ` — +R$ ${comissaoTotal.toFixed(2)} comissão` : ''}</>
            )}
          </button>
        </form>
      </div>

      {/* Vendas recentes */}
      {recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            🕐 Suas vendas recentes
          </h3>
          <div className="space-y-2">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{sale.clienteNome}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{sale.passeioNome}</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                  +R$ {sale.comissaoCalculada.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}