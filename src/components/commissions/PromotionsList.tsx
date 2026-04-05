// src/components/commissions/PromotionsList.tsx
import type { CustomCommission, Tour } from '../../types/commission.types';
import { fmt } from '../../utils/formatHelpers';

interface PromotionsListProps {
  activePromos: CustomCommission[];
  expiredPromos: CustomCommission[];
  tours: Tour[];
  onDelete: (commission: CustomCommission) => Promise<void>;
  onOpenModal: () => void;
}

export function PromotionsList({ activePromos, expiredPromos, tours, onDelete, onOpenModal }: PromotionsListProps) {
  const getTourName = (passeioId: string) => tours.find(t => t.id === passeioId)?.nome || passeioId;

  const getDaysLeft = (dataFim: any) => {
    if (!dataFim) return null;
    return Math.ceil((dataFim.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">🔥 Promoções de Comissão</h3>
        <button onClick={onOpenModal} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600">
          + Nova Promoção
        </button>
      </div>

      {activePromos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-sm">Nenhuma promoção ativa no momento</p>
          <button onClick={onOpenModal} className="text-amber-600 hover:underline text-xs mt-1">Criar primeira promoção</button>
        </div>
      ) : (
        <div className="space-y-2">
          {activePromos.map(commission => {
            const daysLeft = getDaysLeft(commission.dataFim);
            return (
              <div key={commission.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{getTourName(commission.passeioId)}</p>
                  <p className="text-xs text-gray-500">
                    <span className="text-amber-700 font-medium">{fmt(commission.valor)}</span>
                    {commission.dataFim && (
                      <span className={` • ${daysLeft !== null && daysLeft <= 3 ? 'text-red-500' : ''}`}>
                        expira em {commission.dataFim.toDate().toLocaleDateString('pt-BR')} ({daysLeft}d)
                      </span>
                    )}
                    {!commission.dataFim && ' • sem prazo'}
                  </p>
                </div>
                <button onClick={() => onDelete(commission)} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {expiredPromos.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer">Ver {expiredPromos.length} promoção(ões) expirada(s)</summary>
          <div className="mt-2 space-y-1">
            {expiredPromos.map(commission => (
              <div key={commission.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg opacity-60">
                <div>
                  <p className="text-xs font-medium text-gray-700">{getTourName(commission.passeioId)}</p>
                  <p className="text-xs text-gray-400">{fmt(commission.valor)} • expirou {commission.dataFim?.toDate().toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => onDelete(commission)} className="text-red-400 text-xs p-1">🗑️</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}