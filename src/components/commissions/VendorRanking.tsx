// src/components/commissions/VendorRanking.tsx
import { formatCurrency } from '../../utils/commissionCalculations';

// 👇 Passo 1: Definir o tipo de dado que cada vendedor tem
interface VendorData {
  total: number;      // Volume total de vendas
  count: number;      // Quantidade de vendas
  comissao: number;   // Total de comissão
}

// 👇 Passo 2: Definir o tipo das props que o componente vai receber
interface VendorRankingProps {
  salesByVendor: Record<string, VendorData>;  // Um objeto onde a chave é o nome do vendedor
}

// 👇 Passo 3: Criar o componente
export function VendorRanking({ salesByVendor }: VendorRankingProps) {
  // 👇 Passo 4: Verificar se tem dados (se não tiver, não mostra nada)
  if (Object.keys(salesByVendor).length === 0) {
    return null;  // Retorna nada (componente invisível)
  }

  // 👇 Passo 5: Transformar o objeto em array e ordenar por comissão (maior para menor)
  const ranking = Object.entries(salesByVendor)
    .sort((a, b) => b[1].comissao - a[1].comissao)
    .map(([vendor, data], index) => ({
      vendor,
      data,
      position: index + 1,  // Posição no ranking (1º, 2º, 3º...)
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
    }));

  // 👇 Passo 6: Renderizar a tabela (igual ao código original)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="font-semibold mb-3 text-gray-800 dark:text-white text-sm">
        🏆 Ranking de Vendedores
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
            {ranking.map((item) => (
              <tr 
                key={item.vendor} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-3 py-2 text-sm font-bold text-gray-400">
                  {item.medal || `${item.position}º`}
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