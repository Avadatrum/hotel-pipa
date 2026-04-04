// src/components/commissions/CommissionDashboard.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';

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

function ConfirmModal({
  open, title, description, confirmLabel = 'Confirmar',
  danger = false, onConfirm, onCancel
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-[modal-in_0.2s_ease-out]">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <span className="text-2xl">{danger ? '🗑️' : '❓'}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900 shadow-md'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
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

  // Filtros Globais
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // NOVOS: Filtros Específicos da Tabela
  const [tableFilters, setTableFilters] = useState({
    cliente: '',
    passeio: '',
    dataPasseio: ''
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // ── Helper para lidar com Timestamp ou String ───────────────────────────────
  // Isso resolve o erro: Property 'toDate' does not exist on type 'string'
  const safeDate = (dateInput: any): Date => {
    if (!dateInput) return new Date(); // Fallback
    
    // Verifica se é um objeto Timestamp do Firebase (possui toDate)
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    // Se for string (ISO date) ou número (timestamp), cria um Date normal
    return new Date(dateInput);
  };

  // ── Filtragem Combinada (Global + Tabela) ─────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // 1. Filtros Globais
      if (filterVendedor && sale.vendedorNome !== filterVendedor) return false;
      if (filterStatus && sale.status !== filterStatus) return false;
      
      if (dateRange.start) {
        const saleDate = safeDate(sale.dataVenda);
        if (saleDate < new Date(dateRange.start)) return false;
      }
      if (dateRange.end) {
        const saleDate = safeDate(sale.dataVenda);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        if (saleDate > endDate) return false;
      }

      // 2. Filtros da Tabela (Novos)
      if (tableFilters.cliente && !sale.clienteNome.toLowerCase().includes(tableFilters.cliente.toLowerCase())) {
        return false;
      }
      if (tableFilters.passeio && !sale.passeioNome.toLowerCase().includes(tableFilters.passeio.toLowerCase())) {
        return false;
      }
      if (tableFilters.dataPasseio && sale.dataPasseioRealizacao) {
        // Se houver filtro de data de passeio, verifica se é o mesmo dia
        const tripDate = safeDate(sale.dataPasseioRealizacao);
        const filterDate = new Date(tableFilters.dataPasseio);
        
        // Compara apenas ano, mês e dia
        if (tripDate.toDateString() !== filterDate.toDateString()) {
          return false;
        }
      } else if (tableFilters.dataPasseio && !sale.dataPasseioRealizacao) {
        // Se filtrando por data mas a venda não tem data de passeio
        return false;
      }

      return true;
    });
  }, [sales, filterVendedor, filterStatus, dateRange, tableFilters]);

  // ── Estatísticas ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmadas = filteredSales.filter(s => s.status === 'confirmada');
    const totalComissoes = confirmadas.reduce((acc, curr) => acc + curr.comissaoCalculada, 0);
    return {
      totalVendas: confirmadas.length,
      totalCanceladas: filteredSales.filter(s => s.status === 'cancelada').length,
      totalComissoes,
      mediaComissao: confirmadas.length > 0 ? totalComissoes / confirmadas.length : 0,
    };
  }, [filteredSales]);

  // ── Ranking por Vendedor ───────────────────────────────────────────────────
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

  // ── Excluir individual ─────────────────────────────────────────────────────
  const handleDeleteSale = async (saleId: string, clienteNome: string) => {
    if (user?.role !== 'admin') {
      showToast('Apenas administradores podem excluir vendas.', 'error');
      return;
    }
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

  // ── Excluir todas ─────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    setShowDeleteAllModal(false);
    if (user?.role !== 'admin') {
      showToast('Apenas administradores podem excluir vendas.', 'error');
      return;
    }
    if (filteredSales.length === 0) return;

    setDeletingAll(true);
    try {
      const batch = writeBatch(db);
      filteredSales.forEach(sale => {
        batch.delete(doc(db, 'sales', sale.id));
      });
      await batch.commit();
      showToast(`${filteredSales.length} venda(s) excluída(s) com sucesso.`, 'success');
      refreshData();
    } catch (error) {
      console.error('Erro ao excluir vendas:', error);
      showToast('Erro ao excluir vendas.', 'error');
    } finally {
      setDeletingAll(false);
    }
  };

  // ── Exportar CSV ───────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Data Venda', 'Data Passeio', 'Cliente', 'Passeio', 'Qtd', 'Valor Total', 'Comissão', 'Vendedor', 'Status'];
    const rows = filteredSales.map(s => [
      formatDate(safeDate(s.dataVenda)),
      s.dataPasseioRealizacao ? formatDate(safeDate(s.dataPasseioRealizacao)) : 'N/A',
      s.clienteNome,
      s.passeioNome,
      s.quantidade,
      s.valorTotal.toFixed(2),
      s.comissaoCalculada.toFixed(2),
      s.vendedorNome,
      s.status
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Limpar filtros ─────────────────────────────────────────────────────────
  const hasGlobalFilters = filterVendedor || filterStatus || dateRange.start || dateRange.end;
  const hasTableFilters = tableFilters.cliente || tableFilters.passeio || tableFilters.dataPasseio;
  
  const handleClearGlobalFilters = () => {
    setFilterVendedor('');
    setFilterStatus('');
    setDateRange({ start: '', end: '' });
  };

  const handleClearTableFilters = () => {
    setTableFilters({ cliente: '', passeio: '', dataPasseio: '' });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ConfirmModal
        open={showDeleteAllModal}
        title="Excluir todas as vendas?"
        description={`Você está prestes a excluir permanentemente ${filteredSales.length} venda(s). Essa ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir tudo"
        danger
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAllModal(false)}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            📊 Dashboard de Comissões
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm text-sm font-medium"
            >
              📥 Exportar CSV
            </button>

            {user?.role === 'admin' && filteredSales.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                disabled={deletingAll}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingAll ? (
                  <span className="animate-spin inline-block">⏳</span>
                ) : '🗑️'}
                {deletingAll ? 'Excluindo…' : `Excluir tudo`}
              </button>
            )}
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Vendas Confirmadas', value: stats.totalVendas, color: 'border-blue-500', textColor: 'text-blue-600 dark:text-blue-400', icon: '✅' },
            { label: 'Canceladas', value: stats.totalCanceladas, color: 'border-red-500', textColor: 'text-red-600', icon: '❌' },
            { label: 'Total em Comissões', value: formatCurrency(stats.totalComissoes), color: 'border-green-500', textColor: 'text-green-600', icon: '💰' },
            { label: 'Média por Venda', value: formatCurrency(stats.mediaComissao), color: 'border-yellow-500', textColor: 'text-yellow-600', icon: '📈' },
          ].map(card => (
            <div key={card.label} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${card.color} flex items-center gap-4`}>
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
                <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros Globais */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white">🔍 Filtros Gerais</h3>
            {hasGlobalFilters && (
              <button onClick={handleClearGlobalFilters} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                Limpar ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filterVendedor}
              onChange={e => setFilterVendedor(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os vendedores</option>
              {Array.from(new Set(sales.map(s => s.vendedorNome))).sort().map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="confirmada">✅ Confirmada</option>
              <option value="cancelada">❌ Cancelada</option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {hasGlobalFilters && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Mostrando <strong className="text-gray-700 dark:text-gray-200">{filteredSales.length}</strong> de <strong className="text-gray-700 dark:text-gray-200">{sales.length}</strong> vendas
            </p>
          )}
        </div>

        {/* Ranking de Vendedores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">🏆 Ranking de Vendedores</h3>
          {Object.keys(salesByVendor).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum dado para o período selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-2 text-left rounded-l-lg">#</th>
                    <th className="px-4 py-2 text-left">Vendedor</th>
                    <th className="px-4 py-2 text-right">Vendas</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right rounded-r-lg">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(salesByVendor)
                    .sort((a, b) => b[1].comissao - a[1].comissao)
                    .map(([vendor, data], i) => (
                      <tr key={vendor} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-2 text-sm font-bold text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-white">{vendor}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{data.count}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{formatCurrency(data.total)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-green-600">{formatCurrency(data.comissao)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabela de Vendas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              📋 Vendas Realizadas
              <span className="ml-2 text-xs font-normal text-gray-400">({filteredSales.length})</span>
            </h3>

            {/* NOVO: Barra de Filtros da Tabela */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={tableFilters.cliente}
                onChange={e => setTableFilters(prev => ({ ...prev, cliente: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 md:w-auto"
              />
              <input
                type="text"
                placeholder="Buscar passeio..."
                value={tableFilters.passeio}
                onChange={e => setTableFilters(prev => ({ ...prev, passeio: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 md:w-auto"
              />
              <input
                type="date"
                placeholder="Data Passeio"
                value={tableFilters.dataPasseio}
                onChange={e => setTableFilters(prev => ({ ...prev, dataPasseio: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {hasTableFilters && (
                <button
                  onClick={handleClearTableFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                  title="Limpar filtros da tabela"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 text-left">Data Venda</th>
                  <th className="px-3 py-2 text-left">Data Passeio</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Passeio</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-right">Comissão</th>
                  <th className="px-3 py-2 text-left">Vendedor</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  {user?.role === 'admin' && (
                    <th className="px-3 py-2 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(safeDate(sale.dataVenda))}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {sale.dataPasseioRealizacao ? formatDate(safeDate(sale.dataPasseioRealizacao)) : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white">
                      {sale.clienteNome}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]" title={sale.passeioNome}>{sale.passeioNome}</td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{sale.quantidade}</td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatCurrency(sale.valorTotal)}</td>
                    <td className="px-3 py-2 text-sm text-right font-bold text-green-600 whitespace-nowrap">{formatCurrency(sale.comissaoCalculada)}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{sale.vendedorNome}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        sale.status === 'confirmada'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {sale.status === 'confirmada' ? '✓ Confirmada' : '✗ Cancelada'}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleDeleteSale(sale.id, sale.clienteNome)}
                          disabled={deletingId === sale.id || deletingAll}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-all disabled:opacity-30"
                          title="Excluir venda"
                        >
                          {deletingId === sale.id ? (
                            <span className="animate-spin inline-block text-xs">⏳</span>
                          ) : '🗑️'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSales.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">Nenhuma venda encontrada com os filtros atuais.</p>
                {(hasGlobalFilters || hasTableFilters) && (
                  <div className="mt-2 flex justify-center gap-3">
                    {hasGlobalFilters && <button onClick={handleClearGlobalFilters} className="text-xs text-blue-500 hover:underline">Limpar filtros globais</button>}
                    {hasTableFilters && <button onClick={handleClearTableFilters} className="text-xs text-blue-500 hover:underline">Limpar busca</button>}
                  </div>
                )}
              </div>
            )}
          </div>
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