// src/components/commissions/CommissionDashboard.tsx
import { useState } from 'react';
import { useCommissions } from '../../contexts/CommissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';
import type { Sale } from '../../types';

export function CommissionDashboard() {
  const { sales, tours, loading, totalCommissions } = useCommissions();
  const { user } = useAuth();
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Estatísticas
  const stats = {
    totalVendas: sales.filter(s => s.status === 'confirmada').length,
    totalCanceladas: sales.filter(s => s.status === 'cancelada').length,
    totalComissoes: totalCommissions,
    mediaComissao: sales.filter(s => s.status === 'confirmada').length > 0
      ? totalCommissions / sales.filter(s => s.status === 'confirmada').length
      : 0
  };
  
  // Vendas por vendedor
  const salesByVendor = sales.reduce((acc, sale) => {
    if (sale.status !== 'confirmada') return acc;
    if (!acc[sale.vendedorNome]) {
      acc[sale.vendedorNome] = { total: 0, count: 0, comissao: 0 };
    }
    acc[sale.vendedorNome].total += sale.valorTotal;
    acc[sale.vendedorNome].count += 1;
    acc[sale.vendedorNome].comissao += sale.comissaoCalculada;
    return acc;
  }, {} as Record<string, { total: number; count: number; comissao: number }>);
  
  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    if (filterVendedor && sale.vendedorNome !== filterVendedor) return false;
    if (filterStatus && sale.status !== filterStatus) return false;
    if (dateRange.start) {
      const saleDate = sale.dataVenda.toDate();
      const startDate = new Date(dateRange.start);
      if (saleDate < startDate) return false;
    }
    if (dateRange.end) {
      const saleDate = sale.dataVenda.toDate();
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      if (saleDate > endDate) return false;
    }
    return true;
  });
  
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
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        📊 Dashboard de Comissões
      </h1>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Vendas</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalVendas}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Canceladas</p>
          <p className="text-2xl font-bold text-red-600">{stats.totalCanceladas}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total em Comissões</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalComissoes)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Média por Venda</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.mediaComissao)}</p>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterVendedor}
            onChange={(e) => setFilterVendedor(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Todos os vendedores</option>
            {Object.keys(salesByVendor).map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Todos os status</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Data final"
            />
          </div>
        </div>
      </div>
      
      {/* Ranking de vendedores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">🏆 Ranking de Vendedores</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Vendedor</th>
                <th className="px-4 py-2 text-right text-sm">Vendas</th>
                <th className="px-4 py-2 text-right text-sm">Total (R$)</th>
                <th className="px-4 py-2 text-right text-sm">Comissão (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(salesByVendor)
                .sort((a, b) => b[1].comissao - a[1].comissao)
                .map(([vendor, data]) => (
                  <tr key={vendor}>
                    <td className="px-4 py-2 text-sm">{vendor}</td>
                    <td className="px-4 py-2 text-sm text-right">{data.count}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(data.total)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold text-green-600">
                      {formatCurrency(data.comissao)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Tabela de vendas detalhada */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">📋 Vendas Realizadas</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-sm">Data</th>
                <th className="px-3 py-2 text-left text-sm">Cliente</th>
                <th className="px-3 py-2 text-left text-sm">Passeio</th>
                <th className="px-3 py-2 text-right text-sm">Qtd</th>
                <th className="px-3 py-2 text-right text-sm">Valor</th>
                <th className="px-3 py-2 text-right text-sm">Comissão</th>
                <th className="px-3 py-2 text-left text-sm">Vendedor</th>
                <th className="px-3 py-2 text-center text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-sm">{formatDate(sale.dataVenda)}</td>
                  <td className="px-3 py-2 text-sm">{sale.clienteNome}</td>
                  <td className="px-3 py-2 text-sm truncate max-w-[150px]">{sale.passeioNome}</td>
                  <td className="px-3 py-2 text-sm text-right">{sale.quantidade}</td>
                  <td className="px-3 py-2 text-sm text-right">{formatCurrency(sale.valorTotal)}</td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-green-600">
                    {formatCurrency(sale.comissaoCalculada)}
                  </td>
                  <td className="px-3 py-2 text-sm">{sale.vendedorNome}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'confirmada' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {sale.status === 'confirmada' ? '✓ Confirmada' : '✗ Cancelada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}