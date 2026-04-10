// src/pages/serviceOrders/ServiceOrderReports.tsx
import { useMemo, useState } from 'react';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { OSCharts } from '../../components/serviceOrders/OSCharts';
import { OSMetrics } from '../../components/serviceOrders/OSMetrics';
import { formatOSDate, getOSTipoLabel, calculateElapsedTime } from '../../utils/osHelpers';
import { useToast } from '../../hooks/useToast';

export function ServiceOrderReports() {
  const { orders, loading } = useServiceOrders();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return orders.filter(o => new Date(o.dataCriacao) >= cutoffDate);
  }, [orders, dateRange]);
  
  const reportData = useMemo(() => {
    const concluidas = filteredOrders.filter(o => o.status === 'concluida');
    
    // Tempo médio por tipo
    const tempoPorTipo: Record<string, { total: number; count: number }> = {};
    concluidas.forEach(o => {
      if (o.dataCriacao && o.dataConclusao) {
        const horas = (new Date(o.dataConclusao).getTime() - new Date(o.dataCriacao).getTime()) / (1000 * 60 * 60);
        if (!tempoPorTipo[o.tipo]) tempoPorTipo[o.tipo] = { total: 0, count: 0 };
        tempoPorTipo[o.tipo].total += horas;
        tempoPorTipo[o.tipo].count++;
      }
    });
    
    const tempoMedioPorTipo = Object.entries(tempoPorTipo)
      .map(([tipo, { total, count }]) => ({
        tipo,
        label: getOSTipoLabel(tipo as any),
        horasMedias: Math.round((total / count) * 10) / 10
      }))
      .sort((a, b) => b.horasMedias - a.horasMedias);
    
    // OS por mês
    const porMes: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const mes = o.dataCriacao.substring(0, 7);
      porMes[mes] = (porMes[mes] || 0) + 1;
    });
    
    const osPorMes = Object.entries(porMes)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, count]) => ({ mes, count }));
    
    return { tempoMedioPorTipo, osPorMes };
  }, [filteredOrders]);
  
  const handleExportCSV = () => {
    // Atualizado: Removido 'Prioridade' e substituído 'Local' por 'local'
    const headers = ['Número', 'Título', 'Tipo', 'Status', 'Local', 'Solicitante', 'Executor', 'Data Criação', 'Data Conclusão', 'Tempo Total'];
    const rows = filteredOrders.map(o => [
      o.numero,
      o.titulo,
      getOSTipoLabel(o.tipo),
      o.status,
      o.local, // Alterado de o.localNome
      o.solicitanteNome,
      o.executorNome || '',
      formatOSDate(o.dataCriacao),
      o.dataConclusao ? formatOSDate(o.dataConclusao) : '',
      o.dataConclusao ? calculateElapsedTime(o.dataCriacao, o.dataConclusao) : ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_os_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Relatório exportado com sucesso!', 'success');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios de OS
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Análise detalhada das ordens de serviço
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo período</option>
          </select>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     transition-colors flex items-center gap-2 font-medium"
          >
            <span>📥</span> Exportar CSV
          </button>
        </div>
      </div>
      
      {/* Métricas */}
      <OSMetrics orders={filteredOrders} loading={loading} />
      
      {/* Gráficos */}
      <OSCharts orders={filteredOrders} loading={loading} />
      
      {/* Tabela de tempo médio por tipo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tempo Médio de Conclusão por Tipo
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Tipo de Serviço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Tempo Médio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Total de OS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.tempoMedioPorTipo.map((item) => {
                const count = filteredOrders.filter(o => o.tipo === item.tipo && o.status === 'concluida').length;
                return (
                  <tr key={item.tipo}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.horasMedias < 24 
                        ? `${item.horasMedias} horas`
                        : `${Math.round(item.horasMedias / 24 * 10) / 10} dias`
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {count} OS concluídas
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}