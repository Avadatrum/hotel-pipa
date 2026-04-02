// src/components/commissions/SalesRegister.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import { calculateCommission } from '../../utils/commissionCalculations';
import type { Tour } from '../../types';

export function SalesRegister() {
  const { user } = useAuth();
  const { tours, customCommissions, refreshData } = useCommissions();
  const { showToast } = useToast();
  
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [precoTotal, setPrecoTotal] = useState(0);

  useEffect(() => {
    if (selectedTour) {
      const total = selectedTour.precoBase * quantidade;
      setPrecoTotal(total);
    }
  }, [selectedTour, quantidade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTour) {
      showToast('Selecione um passeio', 'warning');
      return;
    }
    
    if (!clienteNome) {
      showToast('Digite o nome do cliente', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const comissao = await calculateCommission(
        selectedTour.id,
        selectedTour.agenciaId,
        precoTotal,
        customCommissions
      );
      
      const saleData = {
        dataVenda: Timestamp.now(),
        passeioId: selectedTour.id,
        passeioNome: selectedTour.nome,
        quantidade,
        precoUnitarioVendido: selectedTour.precoBase,
        valorTotal: precoTotal,
        comissaoCalculada: comissao,
        vendedorId: user?.id,
        vendedorNome: user?.name || user?.email,
        clienteNome,
        clienteTelefone,
        observacoes,
        status: 'confirmada',
        createdAt: Timestamp.now(),
        canceledAt: null,
        canceledBy: null
      };
      
      await addDoc(collection(db, 'sales'), saleData);
      
      showToast('✅ Venda registrada com sucesso!', 'success');
      
      // Limpar formulário
      setSelectedTour(null);
      setQuantidade(1);
      setClienteNome('');
      setClienteTelefone('');
      setObservacoes('');
      
      refreshData();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      showToast('❌ Erro ao registrar venda', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        📝 Registrar Venda de Passeio
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Passeio *
          </label>
          <select
            value={selectedTour?.id || ''}
            onChange={(e) => {
              const tour = tours.find(t => t.id === e.target.value);
              setSelectedTour(tour || null);
            }}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            required
          >
            <option value="">Selecione um passeio</option>
            {tours.map(tour => (
              <option key={tour.id} value={tour.id}>
                {tour.nome} - R$ {tour.precoBase} ({tour.unidade})
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Quantidade *
            </label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Valor Total
            </label>
            <input
              type="text"
              value={`R$ ${precoTotal.toFixed(2)}`}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-600"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Nome do Cliente *
          </label>
          <input
            type="text"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telefone do Cliente
          </label>
          <input
            type="tel"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registrando...' : '💰 Registrar Venda'}
        </button>
      </form>
    </div>
  );
}