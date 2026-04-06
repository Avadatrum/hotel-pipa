// src/components/commissions/VendorRanking.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

interface VendorData {
  total: number;
  count: number;
  comissao: number;
}

interface VendorRankingProps {
  salesByVendor: Record<string, VendorData>;
}

const POSITION_STYLES = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-800',
  'bg-amber-600 text-amber-100',
];

export function VendorRanking({ salesByVendor }: VendorRankingProps) {
  if (Object.keys(salesByVendor).length === 0) return null;

  const ranking = Object.entries(salesByVendor)
    .sort((a, b) => b[1].comissao - a[1].comissao)
    .map(([vendor, data], index) => ({ vendor, data, position: index + 1 }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="font-semibold mb-3 text-gray-800 dark:text-white text-sm">
        Ranking de vendedores
      </h3>
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
            {ranking.map(item => (
              <tr
                key={item.vendor}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      POSITION_STYLES[item.position - 1] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {item.position}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white">
                  {item.vendor}
                </td>
                <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300">
                  {item.data.count}
                </td>
                <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-300">
                  {formatCurrency(item.data.total)}
                </td>
                <td className="px-3 py-2 text-sm text-right font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(item.data.comissao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}