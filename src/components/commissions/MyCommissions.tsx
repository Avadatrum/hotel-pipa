// src/components/commissions/MyCommissions.tsx
import { useState } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore'; // Mudado de deleteDoc para updateDoc
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/commissionCalculations';

export function MyCommissions() {
  const { user } = useAuth();
  const { sales, refreshData } = useCommissions();
  const { showToast } = useToast();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtra apenas vendas confirmadas (canceladas não aparecem aqui)
  const mySales = sales.filter(s => s.vendedorId === user?.id && s.status === 'confirmada');
  
  const total = mySales.reduce((sum, s) => sum + s.comissaoCalculada, 0);

  // Função para CANCELAR a venda (ao invés de excluir)
  const handleCancelSale = async (saleId: string, passeioNome: string) => {
    if (!confirm(`Tem certeza que deseja CANCELAR a venda do passeio "${passeioNome}"? \n\nIsso removerá o valor do seu total de comissões.`)) {
      return;
    }

    setUpdatingId(saleId);

    try {
      const saleRef = doc(db, 'sales', saleId);
      
      // Atualiza o status para 'cancelada'
      await updateDoc(saleRef, {
        status: 'cancelada',
        cancelledAt: new Date(), // Opcional: registrar quando foi cancelado
        cancelledBy: user?.id // Opcional: registrar quem cancelou
      });
      
      showToast('Venda cancelada com sucesso!', 'success');
      refreshData();
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      showToast('Erro ao cancelar venda. Tente novamente.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };
  
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
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mySales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma venda confirmada encontrada.
                  </td>
                </tr>
              ) : (
                mySales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-2 text-sm">{formatDate(sale.dataVenda)}</td>
                    <td className="px-4 py-2 text-sm">{sale.clienteNome}</td>
                    <td className="px-4 py-2 text-sm">{sale.passeioNome}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(sale.valorTotal)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold text-green-600">
                      {formatCurrency(sale.comissaoCalculada)}
                    </td>
                    
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleCancelSale(sale.id, sale.passeioNome)}
                        disabled={updatingId === sale.id}
                        className={`text-red-500 hover:text-red-700 text-sm font-medium transition-colors ${
                          updatingId === sale.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Cancelar venda"
                      >
                        {updatingId === sale.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
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