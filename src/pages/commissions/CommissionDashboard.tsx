// src/pages/commissions/CommissionDashboard.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, deleteDoc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatDate, safeToDate } from '../../utils/commissionCalculations';
import { SalesRegister } from '../../components/commissions/SalesRegister';
import { StatsCards } from '../../components/commissions/StatsCards';
import { GlobalFilters } from '../../components/commissions/GlobalFilters';
import { VendorRanking } from '../../components/commissions/VendorRanking';
import { TableFilters } from '../../components/commissions/TableFilters';
import { SalesTable } from '../../components/commissions/SalesTable';
import { Pagination } from '../../components/commissions/Pagination';
import { ConfirmModal } from '../../components/commissions/ConfirmModal';

const PAGE_SIZE = 20;

export function CommissionDashboard() {
  const { user } = useAuth();
  const { sales, loading, refreshData } = useCommissions();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  // Filtros globais
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const hasGlobalFilters = !!(filterVendedor || filterStatus || dateRange.start || dateRange.end);

  // Filtros da tabela
  const [tableFilters, setTableFilters] = useState({ cliente: '', passeio: '', dataPasseio: '' });
  const hasTableFilters = !!(tableFilters.cliente || tableFilters.passeio || tableFilters.dataPasseio);

  // Paginação e ordenação
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('dataVenda');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Ações
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      const saleDate = safeToDate(sale.dataVenda);
      if (filterVendedor && sale.vendedorNome !== filterVendedor) return false;
      if (filterStatus && sale.status !== filterStatus) return false;
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
    });
  }, [sales, filterVendedor, filterStatus, dateRange, tableFilters]);

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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmadas = filteredSales.filter(s => s.status === 'confirmada');
    const canceladas = filteredSales.filter(s => s.status === 'cancelada');
    const totalComissoes = confirmadas.reduce((a, c) => a + c.comissaoCalculada, 0);
    const totalVendasValor = confirmadas.reduce((a, c) => a + c.valorTotal, 0);
    return {
      totalVendas: confirmadas.length, totalCanceladas: canceladas.length,
      totalComissoes, totalVendasValor,
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

  // ── Ações ──────────────────────────────────────────────────────────────────
  const handleDeleteSale = async (id: string, nome: string) => {
    if (!isAdmin) { showToast('Apenas administradores podem excluir', 'error'); return; }
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'sales', id));
      showToast(`Venda de ${nome} excluída`, 'success'); refreshData();
    } catch { showToast('Erro ao excluir', 'error'); } finally { setDeletingId(null); }
  };

  const handleCancelSale = async (id: string, nome: string) => {
    if (!isAdmin) { showToast('Apenas administradores podem cancelar', 'error'); return; }
    setCancellingId(id);
    try {
      await updateDoc(doc(db, 'sales', id), { status: 'cancelada', cancelledAt: Timestamp.now(), cancelledBy: user?.id });
      showToast(`Venda de ${nome} cancelada`, 'success'); refreshData();
    } catch { showToast('Erro ao cancelar', 'error'); } finally { setCancellingId(null); }
  };

  const handleDeleteAll = async () => {
    setShowDeleteAllModal(false);
    if (!isAdmin || filteredSales.length === 0) return;
    setDeletingAll(true);
    try {
      const batch = writeBatch(db);
      filteredSales.forEach(s => batch.delete(doc(db, 'sales', s.id)));
      await batch.commit();
      showToast(`${filteredSales.length} venda(s) excluída(s)`, 'success'); refreshData();
    } catch { showToast('Erro ao excluir em lote', 'error'); } finally { setDeletingAll(false); }
  };

  const handleExportCSV = () => {
    const headers = ['Data Venda', 'Data Passeio', 'Cliente', 'Telefone', 'Passeio', 'Agência', 'Pax', 'Valor', 'Comissão', 'Vendedor', 'Status'];
    const rows = filteredSales.map(s => [
      formatDate(safeToDate(s.dataVenda)),
      s.dataPasseioRealizacao ? String(s.dataPasseioRealizacao).substring(0, 10) : '',
      s.clienteNome || '', s.clienteTelefone || '',
      s.passeioNome || '', s.agenciaNome || '',
      String(s.quantidadePessoas || s.quantidade || 1),
      s.valorTotal.toFixed(2), s.comissaoCalculada.toFixed(2),
      s.vendedorNome || '', s.status,
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
    setFilterVendedor(''); setFilterStatus(''); setDateRange({ start: '', end: '' });
    setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); setPage(1);
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
      {/* Modal de edição */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingSale(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SalesRegister editingSale={editingSale} onCancelEdit={() => setEditingSale(null)}
                onSaveSuccess={() => { setEditingSale(null); refreshData(); }} />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={showDeleteAllModal} title="Excluir vendas filtradas?"
        description={`Você excluirá permanentemente ${filteredSales.length} venda(s). Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir tudo" danger onConfirm={handleDeleteAll} onCancel={() => setShowDeleteAllModal(false)} />

      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500">{(sales || []).length} vendas no total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Exportar CSV
            </button>
            {isAdmin && filteredSales.length > 0 && (
              <button onClick={() => setShowDeleteAllModal(true)} disabled={deletingAll}
                className="px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                Excluir filtradas
              </button>
            )}
          </div>
        </div>

        {/* Cards de stats */}
        <StatsCards stats={stats} />

        {/* Filtros globais */}
        <GlobalFilters
          filterVendedor={filterVendedor} filterStatus={filterStatus} dateRange={dateRange}
          uniqueVendors={uniqueVendors} totalSalesCount={(sales || []).length}
          filteredSalesCount={filteredSales.length} hasFilters={hasGlobalFilters}
          onFilterVendedorChange={v => { setFilterVendedor(v); setPage(1); }}
          onFilterStatusChange={v => { setFilterStatus(v); setPage(1); }}
          onDateRangeChange={r => { setDateRange(r); setPage(1); }}
          onClearFilters={clearAllFilters}
        />

        {/* Ranking */}
        {Object.keys(salesByVendor).length > 1 && <VendorRanking salesByVendor={salesByVendor} />}

        {/* Tabela */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4">
            <TableFilters filters={tableFilters}
              onFiltersChange={f => { setTableFilters(f); setPage(1); }}
              onClearFilters={() => { setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); setPage(1); }}
              hasFilters={hasTableFilters} totalResults={filteredSales.length} />
          </div>

          <SalesTable sales={paginatedSales} sortField={sortField} sortDir={sortDir} onSort={handleSort}
            isAdmin={isAdmin} onEdit={setEditingSale}
            onCancel={handleCancelSale} onDelete={handleDeleteSale}
            deletingId={deletingId} cancellingId={cancellingId} deletingAll={deletingAll}
            hasFilters={hasGlobalFilters || hasTableFilters}
            onClearGlobalFilters={clearAllFilters}
            onClearTableFilters={() => { setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); setPage(1); }} />

          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} totalItems={filteredSales.length}
              onPageChange={setPage} />
          </div>
        </div>
      </div>
    </>
  );
}