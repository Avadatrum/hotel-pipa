// src/components/commissions/PaymentModal.tsx
import { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/commissionCalculations';
import type { Sale, PaymentMethod } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedSales: Sale[];
  totalAmount: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'pix', label: 'PIX', icon: '📱' },
  { value: 'transfer', label: 'Transferência', icon: '🏦' },
  { value: 'other', label: 'Outro', icon: '💰' },
];

export function PaymentModal({ isOpen, onClose, onSuccess, selectedSales, totalAmount }: PaymentModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [observations, setObservations] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedSales.length === 0) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      // 1. Atualizar cada venda como paga
      selectedSales.forEach(sale => {
        const saleRef = doc(db, 'sales', sale.id);
        batch.update(saleRef, {
          paymentStatus: 'paid',
          paidAt: now,
          paidBy: user?.id,
          paidByName: user?.name || user?.email,
          paymentMethod,
          paymentObservations: observations || null,
          updatedAt: now
        });
      });
      
      // 2. Criar registro de pagamento
      const paymentData = {
        saleIds: selectedSales.map(s => s.id),
        totalAmount,
        paymentMethod,
        paidAt: now,
        paidBy: user?.id,
        paidByName: user?.name || user?.email,
        observations: observations || null,
        createdAt: now,
        // Metadados para relatórios
        agencies: [...new Set(selectedSales.map(s => s.agenciaId).filter(Boolean))],
        vendors: [...new Set(selectedSales.map(s => s.vendedorId))],
        saleCount: selectedSales.length
      };
      
      const paymentRef = doc(collection(db, 'commissionPayments'));
      batch.set(paymentRef, paymentData);
      
      await batch.commit();
      
      showToast(`${selectedSales.length} venda(s) marcada(s) como paga(s)!`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      showToast('Erro ao processar pagamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              💰 Confirmar Pagamento
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedSales.length} venda(s) selecionada(s)
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Resumo */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide font-semibold mb-1">
              Valor Total a Pagar
            </p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Este valor será dividido entre os recepcionistas
            </p>
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{method.icon}</div>
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {method.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              placeholder="Ex: Pago via PIX em 15/01/2024..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Detalhamento das vendas */}
          <div className="max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl">
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Vendas incluídas neste pagamento
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {selectedSales.map(sale => (
                <div key={sale.id} className="px-4 py-2 text-sm flex justify-between items-center">
                  <div>
                    <span className="text-gray-700 dark:text-gray-300">{sale.clienteNome}</span>
                    <span className="text-gray-400 text-xs ml-2">{sale.passeioNome}</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(sale.comissaoCalculada)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processando...
              </>
            ) : (
              <>
                <span>✓</span>
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}