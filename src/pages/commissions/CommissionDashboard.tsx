// src/pages/commissions/CommissionDashboard.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, deleteDoc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/commissionCalculations';
import { SalesRegister } from '../../components/commissions/SalesRegister';
import { StatsCards } from '../../components/commissions/StatsCards';
import { GlobalFilters } from '../../components/commissions/GlobalFilters';
import { VendorRanking } from '../../components/commissions/VendorRanking';
import { TableFilters } from '../../components/commissions/TableFilters';
import { SalesTable } from '../../components/commissions/SalesTable';
import { Pagination } from '../../components/commissions/Pagination';
import { DashboardHeader } from '../../components/commissions/DashboardHeader';
import { ConfirmModal } from '../../components/commissions/ConfirmModal';

// ─── Componente Principal ────────────────────────────────────────────────────
export function CommissionDashboard() {
  const { user } = useAuth();
  const { sales, loading, refreshData } = useCommissions();
  const { showToast } = useToast();

  // Filtros globais
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filtros da tabela
  const [tableFilters, setTableFilters] = useState({ cliente: '', passeio: '', dataPasseio: '' });

  // Paginação
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modais e ações
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Estado para controlar o Modal de Edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  // Ordenação da tabela
  const [sortField, setSortField] = useState<string>('dataVenda');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Helper Timestamp/String ────────────────────────────────────────────────
  const safeDate = (dateInput: any): Date => {
    if (!dateInput) return new Date();
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    return new Date(dateInput);
  };

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      if (filterVendedor && sale.vendedorNome !== filterVendedor) return false;
      if (filterStatus && sale.status !== filterStatus) return false;
      if (dateRange.start) {
        if (safeDate(sale.dataVenda) < new Date(dateRange.start)) return false;
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59);
        if (safeDate(sale.dataVenda) > end) return false;
      }
      if (tableFilters.cliente && !sale.clienteNome?.toLowerCase().includes(tableFilters.cliente.toLowerCase())) return false;
      if (tableFilters.passeio && !sale.passeioNome?.toLowerCase().includes(tableFilters.passeio.toLowerCase())) return false;
      if (tableFilters.dataPasseio && sale.dataPasseioRealizacao) {
        const tripDate = safeDate(sale.dataPasseioRealizacao);
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
        valA = safeDate(a.dataVenda).getTime();
        valB = safeDate(b.dataVenda).getTime();
      } else if (sortField === 'clienteNome' || sortField === 'passeioNome' || sortField === 'vendedorNome') {
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

  // Paginação
  const paginatedSales = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedSales.slice(start, start + PAGE_SIZE);
  }, [sortedSales, page]);
  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE));

  // ── Estatísticas ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmadas = filteredSales.filter(s => s.status === 'confirmada');
    const totalComissoes = confirmadas.reduce((a, c) => a + c.comissaoCalculada, 0);
    const totalVendasValor = confirmadas.reduce((a, c) => a + c.valorTotal, 0);
    const canceladas = filteredSales.filter(s => s.status === 'cancelada');
    return {
      totalVendas: confirmadas.length,
      totalCanceladas: canceladas.length,
      totalComissoes,
      totalVendasValor,
      mediaComissao: confirmadas.length > 0 ? totalComissoes / confirmadas.length : 0,
      taxaCancelamento: filteredSales.length > 0
        ? ((canceladas.length / filteredSales.length) * 100).toFixed(1)
        : '0.0'
    };
  }, [filteredSales]);

  // ── Ranking Vendedores ────────────────────────────────────────────────────
  const salesByVendor = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      if (sale.status !== 'confirmada') return acc;
      if (!acc[sale.vendedorNome]) acc[sale.vendedorNome] = { total: 0, count: 0, comissao: 0 };
      acc[sale.vendedorNome].total += sale.valorTotal;
      acc[sale.vendedorNome].count += 1;
      acc[sale.vendedorNome].comissao += sale.comissaoCalculada;
      return acc;
    }, {} as Record<string, { total: number; count: number; comissao: number }>);
  }, [filteredSales]);

  // ── Ações Admin ───────────────────────────────────────────────────────────
  const handleDeleteSale = async (saleId: string, clienteNome: string) => {
    if (user?.role !== 'admin') { showToast('Apenas administradores podem excluir vendas.', 'error'); return; }
    setDeletingId(saleId);
    try {
      await deleteDoc(doc(db, 'sales', saleId));
      showToast(`Venda de ${clienteNome} excluída.`, 'success');
      refreshData();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      showToast('Erro ao excluir venda.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelSale = async (saleId: string, clienteNome: string) => {
    if (user?.role !== 'admin') { showToast('Apenas administradores podem cancelar vendas.', 'error'); return; }
    setCancellingId(saleId);
    try {
      await updateDoc(doc(db, 'sales', saleId), {
        status: 'cancelada',
        cancelledAt: Timestamp.now(),
        cancelledBy: user?.id
      });
      showToast(`Venda de ${clienteNome} cancelada.`, 'success');
      refreshData();
    } catch (error) {
      showToast('Erro ao cancelar venda.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteAllModal(false);
    if (user?.role !== 'admin') { showToast('Apenas administradores.', 'error'); return; }
    if (filteredSales.length === 0) return;
    setDeletingAll(true);
    try {
      const batch = writeBatch(db);
      filteredSales.forEach(sale => batch.delete(doc(db, 'sales', sale.id)));
      await batch.commit();
      showToast(`${filteredSales.length} venda(s) excluída(s).`, 'success');
      refreshData();
    } catch (error) {
      showToast('Erro ao excluir vendas.', 'error');
    } finally {
      setDeletingAll(false);
    }
  };

  const openEditModal = (sale: any) => {
    setEditingSale(sale);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingSale(null);
    refreshData();
  };

  const handleExportCSV = () => {
    const headers = ['Data Venda', 'Data Passeio', 'Cliente', 'Telefone', 'Passeio', 'Agência', 'Qtd', 'Valor Total', 'Comissão', 'Vendedor', 'Status'];
    const rows = filteredSales.map(s => [
      formatDate(safeDate(s.dataVenda)),
      s.dataPasseioRealizacao ? formatDate(safeDate(s.dataPasseioRealizacao)) : '',
      s.clienteNome || '',
      (s as any).clienteTelefone || '',
      s.passeioNome || '',
      (s as any).agenciaNome || '',
      String(s.quantidade || 1),
      s.valorTotal.toFixed(2),
      s.comissaoCalculada.toFixed(2),
      s.vendedorNome || '',
      s.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_comissoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('✅ CSV exportado!', 'success');
  };

  const hasTableFilters = !!(tableFilters.cliente || tableFilters.passeio || tableFilters.dataPasseio);
  const handleClearTableFilters = () => { setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); setPage(1); };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const uniqueVendors = useMemo(() => Array.from(new Set((sales || []).map(s => s.vendedorNome))).sort(), [sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p className="text-gray-500 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showEditModal && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SalesRegister 
                editingSale={editingSale} 
                onCancelEdit={() => setShowEditModal(false)} 
                onSaveSuccess={handleEditSuccess} 
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteAllModal}
        title="Excluir todas as vendas filtradas?"
        description={`Você está prestes a excluir permanentemente ${filteredSales.length} venda(s). Essa ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir tudo"
        danger
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAllModal(false)}
      />

      <div className="space-y-5">
        <DashboardHeader
          onExportCSV={handleExportCSV}
          onDeleteAll={() => setShowDeleteAllModal(true)}
          isAdmin={user?.role === 'admin'}
          hasSalesToDelete={filteredSales.length > 0}
          isDeletingAll={deletingAll}
          filteredSalesCount={filteredSales.length}
        />

        <StatsCards stats={stats} />

        <GlobalFilters
          filterVendedor={filterVendedor}
          filterStatus={filterStatus}
          dateRange={dateRange}
          onFilterVendedorChange={(value) => {
            setFilterVendedor(value);
            setPage(1);
          }}
          onFilterStatusChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
          onClearFilters={() => {
            setFilterVendedor('');
            setFilterStatus('');
            setDateRange({ start: '', end: '' });
            setPage(1);
          }}
          uniqueVendors={uniqueVendors}
          totalSalesCount={(sales || []).length}
          filteredSalesCount={filteredSales.length}
          hasFilters={!!(filterVendedor || filterStatus || dateRange.start || dateRange.end)}
        />

        <VendorRanking salesByVendor={salesByVendor} />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <TableFilters
            filters={tableFilters}
            onFiltersChange={(newFilters) => {
              setTableFilters(newFilters);
              setPage(1);
            }}
            onClearFilters={handleClearTableFilters}
            hasFilters={hasTableFilters}
            totalResults={filteredSales.length}
          />

          <SalesTable
            sales={paginatedSales}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isAdmin={user?.role === 'admin'}
            onEdit={openEditModal}
            onCancel={handleCancelSale}
            onDelete={handleDeleteSale}
            deletingId={deletingId}
            cancellingId={cancellingId}
            deletingAll={deletingAll}
            hasFilters={!!(filterVendedor || filterStatus || dateRange.start || dateRange.end || hasTableFilters)}
            onClearGlobalFilters={() => {
              setFilterVendedor('');
              setFilterStatus('');
              setDateRange({ start: '', end: '' });
              setPage(1);
            }}
            onClearTableFilters={handleClearTableFilters}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredSales.length}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}