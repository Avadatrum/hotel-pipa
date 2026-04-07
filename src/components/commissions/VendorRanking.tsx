// src/components/commissions/VendorRanking.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

interface VendorData { total: number; count: number; comissao: number; }
const MEDALS = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-amber-100'];

export function VendorRanking({ salesByVendor }: { salesByVendor: Record<string, VendorData> }) {
  const ranking = Object.entries(salesByVendor)
    .sort((a, b) => b[1].comissao - a[1].comissao)
    .map(([vendor, data], i) => ({ vendor, data, pos: i + 1 }));

  if (ranking.length === 0) return null;

  const maxComissao = Math.max(...ranking.map(r => r.data.comissao), 1);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Ranking por comissão</h3>
      <div className="space-y-3">
        {ranking.map(item => (
          <div key={item.vendor}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${MEDALS[item.pos - 1] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {item.pos}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[120px]">{item.vendor}</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{item.data.count} venda{item.data.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(item.data.comissao)}</div>
                <div className="text-xs text-gray-400">{formatCurrency(item.data.total)} em vendas</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${(item.data.comissao / maxComissao) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}