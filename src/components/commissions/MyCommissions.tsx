// src/components/commissions/MyCommissions.tsx
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales } = useCommissions();
  
  const mySales = sales.filter(s => s.vendedorId === user?.id && s.status === 'confirmada');
  
  const total = mySales.reduce((sum, s) => sum + s.comissaoCalculada, 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">👤</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
          <p className="text-gray-500">Total de Comissões: {formatCurrency(total)}</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Passeio</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {mySales.map(sale => (
                <tr key={sale.id}>
                  <td className="px-4 py-2 text-sm">{formatDate(sale.dataVenda)}</td>
                  <td className="px-4 py-2 text-sm">{sale.clienteNome}</td>
                  <td className="px-4 py-2 text-sm">{sale.passeioNome}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(sale.valorTotal)}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold text-green-600">
                    {formatCurrency(sale.comissaoCalculada)}
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