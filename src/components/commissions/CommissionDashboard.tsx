// src/components/commissions/CommissionDashboard.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, deleteDoc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';
import { SalesRegister } from './SalesRegister';

// ─── Modal de Confirmação ────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-[modal-in_0.2s_ease-out]">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <span className="text-2xl">{danger ? '🗑️' : '❓'}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // Função para abrir o modal de edição
  const openEditModal = (sale: any) => {
    setEditingSale(sale);
    setShowEditModal(true);
  };

  // Callback para fechar o modal e atualizar
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingSale(null);
    refreshData();
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
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

  // ── Helpers filtros ────────────────────────────────────────────────────────
  const hasGlobalFilters = filterVendedor || filterStatus || dateRange.start || dateRange.end;
  const hasTableFilters = tableFilters.cliente || tableFilters.passeio || tableFilters.dataPasseio;
  const handleClearGlobalFilters = () => { setFilterVendedor(''); setFilterStatus(''); setDateRange({ start: '', end: '' }); setPage(1); };
  const handleClearTableFilters = () => { setTableFilters({ cliente: '', passeio: '', dataPasseio: '' }); setPage(1); };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };
  
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 text-xs ml-0.5">↕</span>;
    return <span className="text-blue-500 text-xs ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Vendedores únicos para o select
  const uniqueVendors = useMemo(() => Array.from(new Set((sales || []).map(s => s.vendedorNome))).sort(), [sales]);

  // ── Loading ─────────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal de Edição */}
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

      {/* Modal de Confirmação de Exclusão em Massa */}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Dashboard de Comissões</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredSales.length === 0}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
            >
              📥 Exportar CSV
            </button>
            {user?.role === 'admin' && filteredSales.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                disabled={deletingAll}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-60"
              >
                {deletingAll ? <span className="animate-spin inline-block">⏳</span> : '🗑️'}
                {deletingAll ? 'Excluindo…' : 'Excluir filtrados'}
              </button>
            )}
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Vendas Confirmadas', value: stats.totalVendas, color: 'border-blue-500', textColor: 'text-blue-600 dark:text-blue-400', icon: '✅', sub: formatCurrency(stats.totalVendasValor) },
            { label: 'Canceladas', value: `${stats.totalCanceladas} (${stats.taxaCancelamento}%)`, color: 'border-red-400', textColor: 'text-red-600', icon: '❌', sub: null },
            { label: 'Total Comissões', value: formatCurrency(stats.totalComissoes), color: 'border-green-500', textColor: 'text-green-600', icon: '💰', sub: null },
            { label: 'Média por Venda', value: formatCurrency(stats.mediaComissao), color: 'border-amber-400', textColor: 'text-amber-600', icon: '📈', sub: null },
          ].map(card => (
            <div key={card.label} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${card.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{card.icon}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-tight">{card.label}</p>
              </div>
              <p className={`text-lg font-bold ${card.textColor}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filtros Globais */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">🔍 Filtros</h3>
            {hasGlobalFilters && (
              <button onClick={handleClearGlobalFilters} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                Limpar ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <select
              value={filterVendedor}
              onChange={e => { setFilterVendedor(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os vendedores</option>
              {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="confirmada">✅ Confirmada</option>
              <option value="cancelada">❌ Cancelada</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => { setDateRange(r => ({ ...r, start: e.target.value })); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="De"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={e => { setDateRange(r => ({ ...r, end: e.target.value })); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Até"
            />
          </div>
          {hasGlobalFilters && (
            <p className="mt-2 text-xs text-gray-400">
              Mostrando <strong className="text-gray-700 dark:text-gray-200">{filteredSales.length}</strong> de{' '}
              <strong className="text-gray-700 dark:text-gray-200">{(sales || []).length}</strong> vendas
            </p>
          )}
        </div>

        {/* Ranking Vendedores */}
        {Object.keys(salesByVendor).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white text-sm">🏆 Ranking de Vendedores</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2 text-left rounded-l-lg">#</th>
                    <th className="px-3 py-2 text-left">Vendedor</th>
                    <th className="px-3 py-2 text-right">Vendas</th>
                    <th className="px-3 py-2 text-right">Volume</th>
                    <th className="px-3 py-2 text-right rounded-r-lg">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(salesByVendor)
                    .sort((a, b) => b[1].comissao - a[1].comissao)
                    .map(([vendor, data], i) => (
                      <tr key={vendor} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-bold text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white">{vendor}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{data.count}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{formatCurrency(data.total)}</td>
                        <td className="px-3 py-2 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(data.comissao)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabela de Vendas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
              📋 Vendas Realizadas
              <span className="ml-2 text-xs font-normal text-gray-400">({filteredSales.length})</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="🔍 Cliente..."
                value={tableFilters.cliente}
                onChange={e => { setTableFilters(p => ({ ...p, cliente: e.target.value })); setPage(1); }}
                className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
              />
              <input
                type="text"
                placeholder="🎫 Passeio..."
                value={tableFilters.passeio}
                onChange={e => { setTableFilters(p => ({ ...p, passeio: e.target.value })); setPage(1); }}
                className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
              />
              <input
                type="date"
                value={tableFilters.dataPasseio}
                onChange={e => { setTableFilters(p => ({ ...p, dataPasseio: e.target.value })); setPage(1); }}
                className="border rounded-lg px-2.5 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {hasTableFilters && (
                <button onClick={handleClearTableFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleSort('dataVenda')}>
                    Data Venda <SortIcon field="dataVenda" />
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap hidden lg:table-cell">Data Passeio</th>
                  <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none" onClick={() => handleSort('clienteNome')}>
                    Cliente <SortIcon field="clienteNome" />
                  </th>
                  <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden md:table-cell" onClick={() => handleSort('passeioNome')}>
                    Passeio <SortIcon field="passeioNome" />
                  </th>
                  <th className="px-3 py-2.5 text-left hidden md:table-cell">Agência</th>
                  <th className="px-3 py-2.5 text-right hidden md:table-cell">Qtd</th>
                  <th className="px-3 py-2.5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden sm:table-cell" onClick={() => handleSort('valorTotal')}>
                    Valor <SortIcon field="valorTotal" />
                  </th>
                  <th className="px-3 py-2.5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none" onClick={() => handleSort('comissaoCalculada')}>
                    Comissão <SortIcon field="comissaoCalculada" />
                  </th>
                  <th className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden lg:table-cell" onClick={() => handleSort('vendedorNome')}>
                    Vendedor <SortIcon field="vendedorNome" />
                  </th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  {user?.role === 'admin' && <th className="px-3 py-2.5 text-center">Ações</th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-sm">Nenhuma venda encontrada com os filtros atuais.</p>
                      {(hasGlobalFilters || hasTableFilters) && (
                        <div className="mt-2 flex justify-center gap-3">
                          {hasGlobalFilters && <button onClick={handleClearGlobalFilters} className="text-xs text-blue-500 hover:underline">Limpar filtros</button>}
                          {hasTableFilters && <button onClick={handleClearTableFilters} className="text-xs text-blue-500 hover:underline">Limpar busca</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map(sale => (
                    <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${sale.status === 'cancelada' ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(safeDate(sale.dataVenda))}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap hidden lg:table-cell">
                        {sale.dataPasseioRealizacao ? formatDate(safeDate(sale.dataPasseioRealizacao)) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-white">
                        <div>{sale.clienteNome}</div>
                        {(sale as any).clienteTelefone && (
                          <div className="text-xs text-gray-400">{(sale as any).clienteTelefone}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[130px] hidden md:table-cell" title={sale.passeioNome}>
                        {sale.passeioNome}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {(sale as any).agenciaNome ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            🏢 {(sale as any).agenciaNome}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">{sale.quantidade || 1}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                        {formatCurrency(sale.valorTotal)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                        {formatCurrency(sale.comissaoCalculada)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">
                        {sale.vendedorNome}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          sale.status === 'confirmada'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {sale.status === 'confirmada' ? '✓ Confirmada' : '✗ Cancelada'}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(sale)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded transition-all text-xs"
                              title="Editar venda"
                            >
                              ✏️
                            </button>
                            {sale.status === 'confirmada' && (
                              <button
                                onClick={() => handleCancelSale(sale.id, sale.clienteNome)}
                                disabled={cancellingId === sale.id}
                                className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 p-1.5 rounded transition-all disabled:opacity-30 text-xs"
                                title="Cancelar venda"
                              >
                                {cancellingId === sale.id ? '⏳' : '⛔'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSale(sale.id, sale.clienteNome)}
                              disabled={deletingId === sale.id || deletingAll}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-all disabled:opacity-30"
                              title="Excluir venda"
                            >
                              {deletingId === sale.id ? <span className="animate-spin inline-block text-xs">⏳</span> : '🗑️'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">
                Página {page} de {totalPages} · {filteredSales.length} registros
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2.5 py-1 border rounded text-xs transition-colors ${
                        page === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  »
                </button>
              </div>
            </div>
          )}
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