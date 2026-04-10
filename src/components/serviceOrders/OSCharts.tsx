// src/components/serviceOrders/OSCharts.tsx
import { useMemo } from 'react';
import { type ServiceOrder, OS_STATUS } from '../../types/serviceOrder.types';
import { getOSTipoLabel } from '../../utils/osHelpers';

interface OSChartsProps {
  orders: ServiceOrder[];
  loading?: boolean;
}

export function OSCharts({ orders, loading = false }: OSChartsProps) {
  const chartData = useMemo(() => {
    // Dados por status
    const byStatus = OS_STATUS.map(status => ({
      label: status.label,
      value: orders.filter(o => o.status === status.value).length,
      color: status.value === 'aberta' ? '#3B82F6' :
             status.value === 'em_andamento' ? '#EAB308' :
             status.value === 'concluida' ? '#22C55E' : '#6B7280'
    }));
    
    // Dados por prioridade REMOVIDOS
    
    // Top 5 tipos
    const tipoCount: Record<string, number> = {};
    orders.forEach(o => { tipoCount[o.tipo] = (tipoCount[o.tipo] || 0) + 1; });
    const byType = Object.entries(tipoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, count]) => ({
        label: getOSTipoLabel(tipo as any),
        value: count,
        color: '#8B5CF6'
      }));
    
    // Dados por executor (top 5)
    const executorCount: Record<string, number> = {};
    orders.filter(o => o.executorNome).forEach(o => {
      executorCount[o.executorNome!] = (executorCount[o.executorNome!] || 0) + 1;
    });
    const byExecutor = Object.entries(executorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        label: name,
        value: count,
        color: '#10B981'
      }));
    
    return { byStatus, byType, byExecutor };
  }, [orders]);
  
  const BarChart = ({ data, title, maxBars = 5 }: any) => {
    const maxValue = Math.max(...data.map((d: any) => d.value), 1);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(0, maxBars).map((item: any, index: number) => (
            <div key={index}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                  {item.label}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const DonutChart = ({ data, title }: any) => {
    const total = data.reduce((sum: number, d: any) => sum + d.value, 0);
    let cumulativePercent = 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        
        <div className="flex items-center gap-4">
          {/* SVG Donut */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {data.map((item: any, index: number) => {
                const percent = total > 0 ? (item.value / total) * 100 : 0;
                const startAngle = cumulativePercent * 3.6;
                const endAngle = (cumulativePercent + percent) * 3.6;
                
                const x1 = 18 + 16 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 18 + 16 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 18 + 16 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 18 + 16 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArc = percent > 50 ? 1 : 0;
                
                const pathData = `
                  M 18 18
                  L ${x1} ${y1}
                  A 16 16 0 ${largeArc} 1 ${x2} ${y2}
                  Z
                `;
                
                cumulativePercent += percent;
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={item.color}
                    className="transition-all duration-500"
                  />
                );
              })}
              <circle cx="18" cy="18" r="10" fill="white" className="dark:fill-gray-800" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                  {item.label}
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 animate-pulse" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 animate-pulse" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 animate-pulse" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 animate-pulse" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DonutChart data={chartData.byStatus} title="Distribuição por Status" />
      {/* Gráfico de prioridade REMOVIDO */}
      <BarChart data={chartData.byType} title="Tipos Mais Frequentes" maxBars={5} />
      <BarChart data={chartData.byExecutor} title="Executores com Mais OS" maxBars={5} />
    </div>
  );
}