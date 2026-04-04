// src/components/commissions/MyCommissions.tsx
import { useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';

type FilterStatus = 'confirmada' | 'cancelada' | 'all';
type SortField = 'dataVenda' | 'valorTotal' | 'comissaoCalculada' | 'clienteNome';
type SortDir = 'asc' | 'desc';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales, refreshData } = useCommissions();
  const { showToast } = useToast();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('confirmada');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dataVenda');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Todas as vendas do usuário
  const allMySales = useMemo(
    () => (sales || []).filter(s => s.vendedorId === user?.id),
    [sales, user]
  );

  // Meses disponíveis para filtro
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allMySales.forEach(s => {
      try {
        const d = s.dataVenda.toDate();
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      } catch {}
    });
    return Array.from(months).sort().reverse();
  }, [allMySales]);

  // Vendas filtradas e ordenadas
  const displayedSales = useMemo(() => {
    let list = allMySales;

    // Filtro de status
    if (filterStatus !== 'all') {
      list = list.filter(s => s.status === filterStatus);
    }

    // Filtro de mês
    if (selectedMonth !== 'all') {
      list = list.filter(s => {
        try {
          const d = s.dataVenda.toDate();
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === selectedMonth;
        } catch { return false; }
      });
    }

    // Busca por cliente ou passeio
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        s =>
          s.clienteNome?.toLowerCase().includes(lower) ||
          s.passeioNome?.toLowerCase().includes(lower)
      );
    }

    // Ordenação
    list = [...list].sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === 'dataVenda') {
        try { valA = a.dataVenda.toDate().getTime(); valB = b.dataVenda.toDate().getTime(); }
        catch { valA = 0; valB = 0; }
      } else if (sortField === 'clienteNome') {
        valA = a.clienteNome?.toLowerCase() || '';
        valB = b.clienteNome?.toLowerCase() || '';
      } else {
        valA = (a as any)[sortField] || 0;
        valB = (b as any)[sortField] || 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [allMySales, filterStatus, selectedMonth, searchTerm, sortField, sortDir]);

  // Totais das vendas confirmadas (sempre, independente de filtro para o card de resumo)
  const confirmedSales = useMemo(() => allMySales.filter(s => s.status === 'confirmada'), [allMySales]);
  const totalComissao = confirmedSales.reduce((s, x) => s + x.comissaoCalculada, 0);
  const totalVendas = confirmedSales.reduce((s, x) => s + x.valorTotal, 0);

  // Mês atual
  const thisMonthKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  })();
  const thisMonthComissao = confirmedSales
    .filter(s => {
      try {
        const d = s.dataVenda.toDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === thisMonthKey;
      } catch { return false; }
    })
    .reduce((s, x) => s + x.comissaoCalculada, 0);

  const handleCancelSale = async (saleId: string, passeioNome: string) => {
    if (!confirm(`Tem certeza que deseja CANCELAR a venda do passeio "${passeioNome}"?\n\nIsso removerá o valor do seu total de comissões.`)) return;
    setUpdatingId(saleId);
    try {
      await updateDoc(doc(db, 'sales', saleId), {
        status: 'cancelada',
        cancelledAt: new Date(),
        cancelledBy: user?.id
      });
      showToast('Venda cancelada com sucesso!', 'success');
      refreshData();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      showToast('Erro ao cancelar venda. Tente novamente.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Cliente', 'Telefone', 'Passeio', 'Qtd', 'Valor Total', 'Comissão', 'Status'],
      ...displayedSales.map(s => [
        (() => { try { return formatDate(s.dataVenda); } catch { return ''; } })(),
        s.clienteNome || '',
        (s as any).clienteTelefone || '',
        s.passeioNome || '',
        String(s.quantidade || 1),
        s.valorTotal.toFixed(2),
        s.comissaoCalculada.toFixed(2),
        s.status
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minhas-comissoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ CSV exportado!', 'success');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300">↕</span>;
    return <span className="text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-5">
      {/* Cartão de Resumo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl shadow-lg p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.name}</h2>
            <p className="text-blue-200 text-sm">{confirmedSales.length} venda{confirmedSales.length !== 1 ? 's' : ''} confirmada{confirmedSales.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200 mb-0.5">Total Comissões</div>
            <div className="text-xl font-bold">{formatCurrency(totalComissao)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200 mb-0.5">Este mês</div>
            <div className="text-xl font-bold">{formatCurrency(thisMonthComissao)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 col-span-2">
            <div className="text-xs text-blue-200 mb-0.5">Volume Total de Vendas</div>
            <div className="text-lg font-semibold">{formatCurrency(totalVendas)}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(['confirmada', 'cancelada', 'all'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {s === 'confirmada' ? '✅ Confirmadas' : s === 'cancelada' ? '❌ Canceladas' : '📋 Todas'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="text-xs text-gray-500 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 border rounded-lg px-2.5 py-1.5 hover:border-green-300 transition-colors"
          >
            📥 Exportar CSV
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Busca */}
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Buscar cliente ou passeio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>

          {/* Filtro de mês */}
          {availableMonths.length > 0 && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Todos os meses</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {displayedSales.length} resultado{displayedSales.length !== 1 ? 's' : ''}
          </span>
          {displayedSales.length > 0 && filterStatus !== 'all' && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total: {formatCurrency(displayedSales.reduce((s, x) => s + x.comissaoCalculada, 0))}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort('dataVenda')}
                >
                  Data <SortIcon field="dataVenda" />
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort('clienteNome')}
                >
                  Cliente <SortIcon field="clienteNome" />
                </th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Passeio</th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none hidden md:table-cell"
                  onClick={() => handleSort('valorTotal')}
                >
                  Valor <SortIcon field="valorTotal" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort('comissaoCalculada')}
                >
                  Comissão <SortIcon field="comissaoCalculada" />
                </th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    {searchTerm ? 'Nenhuma venda encontrada para essa busca' : 'Nenhuma venda neste período'}
                  </td>
                </tr>
              ) : (
                displayedSales.map(sale => (
                  <tr
                    key={sale.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${
                      sale.status === 'cancelada' ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {(() => { try { return formatDate(sale.dataVenda); } catch { return '—'; } })()}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                      <div>{sale.clienteNome}</div>
                      {(sale as any).clienteTelefone && (
                        <div className="text-xs text-gray-400">{(sale as any).clienteTelefone}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hidden sm:table-cell max-w-[140px] truncate">
                      {sale.passeioNome}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {formatCurrency(sale.valorTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {formatCurrency(sale.comissaoCalculada)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {sale.status === 'confirmada' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✅ Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          ❌ Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {sale.status === 'confirmada' && (
                        <button
                          onClick={() => handleCancelSale(sale.id, sale.passeioNome)}
                          disabled={updatingId === sale.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 rounded px-2 py-0.5 transition-colors disabled:opacity-40"
                          title="Cancelar venda"
                        >
                          {updatingId === sale.id ? '⏳' : 'Cancelar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
