// src/pages/commissions/CommissionDashboard.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, deleteDoc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatDate, safeToDate, calcularSaldos, agruparVendasPendentesPorAgencia } from '../../utils/commissionCalculations';
import { SalesRegister } from '../../components/commissions/SalesRegister';
import { StatsCards } from '../../components/commissions/StatsCards';
import { GlobalFilters } from '../../components/commissions/GlobalFilters';
import { VendorRanking } from '../../components/commissions/VendorRanking';
import { TableFilters } from '../../components/commissions/TableFilters';
import { SalesTable } from '../../components/commissions/SalesTable';
import { Pagination } from '../../components/commissions/Pagination';
import { ConfirmModal } from '../../components/commissions/ConfirmModal';
import { PaymentModal } from '../../components/commissions/PaymentModal';
import { AgencyReportModal } from '../../components/commissions/AgencyReportModal';
import { PeriodControl, getCurrentQuinzena, getQuinzenaDateRange } from '../../components/commissions/PeriodControl';
import type { AgencyCommissionReport } from '../../types';

const PAGE_SIZE = 20;

export function CommissionDashboard() {
  const { user } = useAuth();
  const { sales, agencies, loading, refreshData } = useCommissions();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  // 🆕 Estado do Período Atual
  const [periodoAtual, setPeriodoAtual] = useState(() => {
    return getCurrentQuinzena();
  });

  // Filtros
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const hasGlobalFilters = !!(filterVendedor || filterStatus || filterPaymentStatus || dateRange.start || dateRange.end);

  // Filtros da tabela
  const [tableFilters, setTableFilters] = useState({ cliente: '', passeio: '', dataPasseio: '' });
  const hasTableFilters = !!(tableFilters.cliente || tableFilters.passeio || tableFilters.dataPasseio);

  // Paginação e ordenação
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('dataVenda');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Seleção múltipla para pagamento
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());

  // Ações
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  
  // Modais novos
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAgencyReportModal, setShowAgencyReportModal] = useState(false);
  const [selectedAgencyReport, setSelectedAgencyReport] = useState<AgencyCommissionReport | null>(null);

  // ── Filtragem com a NOVA LÓGICA ──────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    const { start, end } = getQuinzenaDateRange(periodoAtual);
    
    return (sales || []).filter(sale => {
      // 🔥 REGRA 1: Vendas pendentes SEMPRE aparecem (são dívidas ativas)
      const isPendente = sale.status === 'confirmada' && 
                        (!sale.paymentStatus || sale.paymentStatus === 'pending');
      
      if (isPendente) {
        // Verifica apenas os filtros adicionais (vendedor, cliente, etc)
        // Mas NÃO filtra por data/período
        return checkAdditionalFilters(sale);
      }
      
      // 🔥 REGRA 2: Vendas pagas e canceladas são filtradas por período
      // Baseado na data de REALIZAÇÃO do passeio (não data da venda)
      const dataRealizacao = sale.dataPasseioRealizacao 
        ? safeToDate(sale.dataPasseioRealizacao)
        : safeToDate(sale.dataVenda); // fallback para data da venda
      
      const isInPeriod = dataRealizacao >= start && dataRealizacao <= end;
      
      if (!isInPeriod) return false;
      
      // Verifica arquivamento (apenas para vendas pagas)
      if (sale.paymentStatus === 'paid' && sale.arquivado) {
        return false;
      }
      
      // Filtros adicionais
      return checkAdditionalFilters(sale);
    });
    
    // Função auxiliar para filtros adicionais
    function checkAdditionalFilters(sale: any): boolean {
      const saleDate = safeToDate(sale.dataVenda);
      
      if (filterVendedor && sale.vendedorNome !== filterVendedor) return false;
      if (filterStatus && sale.status !== filterStatus) return false;
      if (filterPaymentStatus && sale.paymentStatus !== filterPaymentStatus) return false;
      
      if (dateRange.start && saleDate < new Date(dateRange.start + 'T00:00:00')) return false;
      if (dateRange.end) {
        const end = new Date(dateRange.end + 'T23:59:59');
        if (saleDate > end) return false;
      }
      
      if (tableFilters.cliente && !sale.clienteNome?.toLowerCase().includes(tableFilters.cliente.toLowerCase())) return false;
      if (tableFilters.passeio && !sale.passeioNome?.toLowerCase().includes(tableFilters.passeio.toLowerCase())) return false;
      
      if (tableFilters.dataPasseio && sale.dataPasseioRealizacao) {
        const tripDate = safeToDate(sale.dataPasseioRealizacao);
        const filterDate = new Date(tableFilters.dataPasseio);
        if (tripDate.toDateString() !== filterDate.toDateString()) return false;
      } else if (tableFilters.dataPasseio && !sale.dataPasseioRealizacao) {
        return false;
      }
      
      return true;
    }
  }, [sales, periodoAtual, filterVendedor, filterStatus, filterPaymentStatus, dateRange, tableFilters]);

  // ── Ordenação ──────────────────────────────────────────────────────────────
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === 'dataVenda') {
        valA = safeToDate(a.dataVenda).getTime();
        valB = safeToDate(b.dataVenda).getTime();
      } else if (['clienteNome', 'passeioNome', 'vendedorNome'].includes(sortField)) {
        valA = ((a as any)[sortField] || '').toLowerCase();
        valB = ((b as any)[sortField] || '').toLowerCase();
      } else {
        valA = (a as any)[sortField] || 0;
        valB = (b as any)[sortField] || 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortField, sortDir]);

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedSales.slice(start, start + PAGE_SIZE);
  }, [sortedSales, page]);

  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE));

  // Cálculo de saldos (pendente vs pago)
  const saldos = useMemo(() => calcularSaldos(filteredSales), [filteredSales]);

  // Cálculo de vendas futuras (passeios ainda não realizados)
  const vendasFuturas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return filteredSales.filter(sale => {
      if (sale.status !== 'confirmada') return false;
      if (!sale.dataPasseioRealizacao) return false;
      
      const dataPasseio = safeToDate(sale.dataPasseioRealizacao);
      return dataPasseio > hoje;
    });
  }, [filteredSales]);

  const vendasFuturasTotal = useMemo(() => 
    vendasFuturas.reduce((sum, s) => sum + s.comissaoCalculada, 0),
    [vendasFuturas]
  );

  const vendasFuturasCount = vendasFuturas.length;

  // Vendas pendentes por agência
  const pendingByAgency = useMemo(() => {
    return agruparVendasPendentesPorAgencia(filteredSales);
  }, [filteredSales]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmadas = filteredSales.filter(s => s.status === 'confirmada');
    const canceladas = filteredSales.filter(s => s.status === 'cancelada');
    const totalComissoes = confirmadas.reduce((a, c) => a + c.comissaoCalculada, 0);
    const totalVendasValor = confirmadas.reduce((a, c) => a + c.valorTotal, 0);
    return {
      totalVendas: confirmadas.length, 
      totalCanceladas: canceladas.length,
      totalComissoes, 
      totalVendasValor,
      mediaComissao: confirmadas.length > 0 ? totalComissoes / confirmadas.length : 0,
      taxaCancelamento: filteredSales.length > 0 ? ((canceladas.length / filteredSales.length) * 100).toFixed(1) : '0.0',
    };
  }, [filteredSales]);

  const salesByVendor = useMemo(() =>
    filteredSales.reduce((acc, sale) => {
      if (sale.status !== 'confirmada') return acc;
      if (!acc[sale.vendedorNome]) acc[sale.vendedorNome] = { total: 0, count: 0, comissao: 0 };
      acc[sale.vendedorNome].total += sale.valorTotal;
      acc[sale.vendedorNome].count += 1;
      acc[sale.vendedorNome].comissao += sale.comissaoCalculada;
      return acc;
    }, {} as Record<string, { total: number; count: number; comissao: number }>),
    [filteredSales]
  );

  const uniqueVendors = useMemo(() => Array.from(new Set((sales || []).map(s => s.vendedorNome))).sort(), [sales]);

  // Seleção de vendas
  const handleSelectSale = (saleId: string, selected: boolean) => {
    const newSelected = new Set(selectedSales);
    if (selected) {
      newSelected.add(saleId);
    } else {
      newSelected.delete(saleId);
    }
    setSelectedSales(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const confirmadasPendentes = paginatedSales
        .filter(s => s.status === 'confirmada' && s.paymentStatus === 'pending')
        .map(s => s.id);
      setSelectedSales(new Set(confirmadasPendentes));
    } else {
      setSelectedSales(new Set());
    }
  };

  const selectedSalesList = useMemo(() => {
    return filteredSales.filter(s => selectedSales.has(s.id));
  }, [filteredSales, selectedSales]);

  const totalSelectedAmount = useMemo(() => {
    return selectedSalesList.reduce((sum, s) => sum + s.comissaoCalculada, 0);
  }, [selectedSalesList]);

  // Abrir relatório de agência
  const handleOpenAgencyReport = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    
    const salesForAgency = filteredSales.filter(s => 
      s.agenciaId === agencyId && 
      s.status === 'confirmada' && 
      (!s.paymentStatus || s.paymentStatus === 'pending')
    );
    
    if (salesForAgency.length === 0) {
      showToast('Nenhuma venda pendente para esta agência', 'info');
      return;
    }

    setSelectedAgencyReport({
      agencyId,
      agencyName: agency?.nome || 'Agência',
      agencyPhone: agency?.telefone,
      pendingSales: salesForAgency,
      totalPending: salesForAgency.reduce((sum, s) => sum + (s.comissaoCalculada || 0), 0),
      periodStart: new Date(Math.min(...salesForAgency.map(s => safeToDate(s.dataVenda).getTime()))),
      periodEnd: new Date()
    });
    
    setShowAgencyReportModal(true);
  };

  // ── Ações ──────────────────────────────────────────────────────────────────
  const handleDeleteSale = async (id: string, nome: string) => {
    if (!isAdmin) { showToast('Apenas administradores podem excluir', 'error'); return; }
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'sales', id));
      showToast(`Venda de ${nome} excluída`, 'success'); 
      refreshData();
    } catch { 
      showToast('Erro ao excluir', 'error'); 
    } finally { 
      setDeletingId(null); 
    }
  };

  const handleCancelSale = async (id: string, nome: string) => {
    if (!isAdmin) { showToast('Apenas administradores podem cancelar', 'error'); return; }
    setCancellingId(id);
    try {
      await updateDoc(doc(db, 'sales', id), { 
        status: 'cancelada', 
        updatedAt: Timestamp.now() 
      });
      showToast(`Venda de ${nome} cancelada`, 'success'); 
      refreshData();
    } catch { 
      showToast('Erro ao cancelar', 'error'); 
    } finally { 
      setCancellingId(null); 
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteAllModal(false);
    if (!isAdmin || filteredSales.length === 0) return;
    setDeletingAll(true);
    try {
      const batch = writeBatch(db);
      filteredSales.forEach(s => batch.delete(doc(db, 'sales', s.id)));
      await batch.commit();
      showToast(`${filteredSales.length} venda(s) excluída(s)`, 'success'); 
      refreshData();
    } catch { 
      showToast('Erro ao excluir em lote', 'error'); 
    } finally { 
      setDeletingAll(false); 
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data Venda', 'Data Passeio', 'Cliente', 'Telefone', 'Passeio', 'Agência', 'Pax', 'Valor', 'Comissão', 'Vendedor', 'Status', 'Pagamento'];
    const rows = filteredSales.map(s => [
      formatDate(safeToDate(s.dataVenda)),
      s.dataPasseioRealizacao ? String(s.dataPasseioRealizacao).substring(0, 10) : '',
      s.clienteNome || '', s.clienteTelefone || '',
      s.passeioNome || '', s.agenciaNome || '',
      String(s.quantidadePessoas || s.quantidade || 1),
      s.valorTotal.toFixed(2), s.comissaoCalculada.toFixed(2),
      s.vendedorNome || '', s.status,
      s.paymentStatus === 'paid' ? 'Pago' : 'Pendente'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `comissoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('CSV exportado', 'success');
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilterVendedor(''); 
    setFilterStatus(''); 
    setFilterPaymentStatus('');
    setDateRange({ start: '', end: '' });
    setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); 
    setPage(1);
  };

  // Handler para mudança de período
  const handlePeriodChange = (newPeriod: string) => {
    setPeriodoAtual(newPeriod);
    setPage(1); 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modais */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingSale(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SalesRegister 
                editingSale={editingSale} 
                onCancelEdit={() => setEditingSale(null)}
                onSaveSuccess={() => { 
                  setEditingSale(null); 
                  refreshData(); 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={showDeleteAllModal} 
        title="Excluir vendas filtradas?"
        description={`Você excluirá permanentemente ${filteredSales.length} venda(s). Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir tudo" 
        danger 
        onConfirm={handleDeleteAll} 
        onCancel={() => setShowDeleteAllModal(false)} 
      />

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          refreshData();
          setSelectedSales(new Set());
        }}
        selectedSales={selectedSalesList}
        totalAmount={totalSelectedAmount}
      />

      {/* Modal de Relatório por Agência */}
      <AgencyReportModal
        isOpen={showAgencyReportModal}
        onClose={() => setShowAgencyReportModal(false)}
        report={selectedAgencyReport}
      />

      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500">{(sales || []).length} vendas no total</p>
          </div>
          <div className="flex gap-2">
            {/* 🆕 Botão de Pagamento - só aparece quando há vendas selecionadas */}
            {selectedSales.size > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>💰</span>
                Pagar {selectedSales.size} venda(s) • {formatCurrency(totalSelectedAmount)}
              </button>
            )}
            
            <button 
              onClick={handleExportCSV}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Exportar CSV
            </button>
            
            {isAdmin && filteredSales.length > 0 && (
              <button 
                onClick={() => setShowDeleteAllModal(true)} 
                disabled={deletingAll}
                className="px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                Excluir filtradas
              </button>
            )}
          </div>
        </div>

        {/* Controle de Período */}
        <PeriodControl
          currentPeriod={periodoAtual}
          onPeriodChange={handlePeriodChange}
          onArchiveComplete={refreshData}
        />

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  Pendentes (sempre visíveis)
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Comissões a receber
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(saldos.totalPendente)}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {saldos.qtdPendentes} vendas pendentes
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Pagas na Quinzena
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Comissões já recebidas
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(saldos.totalPago)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {saldos.qtdPagas} vendas pagas
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Vendas Futuras
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Passeios não realizados
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(vendasFuturasTotal)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {vendasFuturasCount} vendas agendadas
            </p>
          </div>
        </div>

        {/* Lista de Agências com Pendências */}
        {pendingByAgency.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              🏢 Agências com Comissões Pendentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {pendingByAgency.map(item => (
                <button
                  key={item.agencyId}
                  onClick={() => handleOpenAgencyReport(item.agencyId)}
                  className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-left"
                >
                  <div className="font-medium text-purple-700 dark:text-purple-300 text-sm">
                    {item.agencyName}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    {item.sales.length} vendas • {formatCurrency(item.total)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards de stats */}
        <StatsCards stats={stats} />

        {/* Filtros globais */}
        <GlobalFilters
          filterVendedor={filterVendedor} 
          filterStatus={filterStatus} 
          filterPaymentStatus={filterPaymentStatus}
          dateRange={dateRange}
          uniqueVendors={uniqueVendors} 
          totalSalesCount={(sales || []).length}
          filteredSalesCount={filteredSales.length} 
          hasFilters={hasGlobalFilters}
          onFilterVendedorChange={v => { setFilterVendedor(v); setPage(1); }}
          onFilterStatusChange={v => { setFilterStatus(v); setPage(1); }}
          onFilterPaymentStatusChange={v => { setFilterPaymentStatus(v); setPage(1); }}
          onDateRangeChange={r => { setDateRange(r); setPage(1); }}
          onClearFilters={clearAllFilters}
        />

        {/* Ranking */}
        {Object.keys(salesByVendor).length > 1 && <VendorRanking salesByVendor={salesByVendor} />}

        {/* Tabela */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4">
            <TableFilters 
              filters={tableFilters}
              onFiltersChange={f => { setTableFilters(f); setPage(1); }}
              onClearFilters={() => { 
                setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); 
                setPage(1); 
              }}
              hasFilters={hasTableFilters} 
              totalResults={filteredSales.length} 
            />
          </div>

          <SalesTable 
            sales={paginatedSales} 
            sortField={sortField} 
            sortDir={sortDir} 
            onSort={handleSort}
            isAdmin={isAdmin} 
            onEdit={setEditingSale}
            onCancel={handleCancelSale} 
            onDelete={handleDeleteSale}
            deletingId={deletingId} 
            cancellingId={cancellingId} 
            deletingAll={deletingAll}
            hasFilters={hasGlobalFilters || hasTableFilters}
            onClearGlobalFilters={clearAllFilters}
            onClearTableFilters={() => { 
              setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); 
              setPage(1); 
            }}
            selectedSales={selectedSales}
            onSelectSale={handleSelectSale}
            onSelectAll={handleSelectAll}
          />

          <div className="px-4 pb-4">
            <Pagination 
              page={page} 
              totalPages={totalPages} 
              totalItems={filteredSales.length}
              onPageChange={setPage} 
            />
          </div>
        </div>
      </div>
    </>
  );
}

// Helper para formatCurrency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}