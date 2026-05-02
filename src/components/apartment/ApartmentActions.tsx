// src/components/apartment/ApartmentActions.tsx

interface ApartmentActionsProps {
  isOccupied: boolean;
  loading: boolean;
  onCheckin: () => void;
  onCheckout: () => void;
  onHistory: () => void;
  onShareGuide?: () => void; // 🆕
}

export function ApartmentActions({ 
  isOccupied, 
  loading, 
  onCheckin, 
  onCheckout, 
  onHistory,
  onShareGuide // 🆕
}: ApartmentActionsProps) {
  return (
    <div className="space-y-1">
      {!isOccupied ? (
        <button
          onClick={onCheckin}
          disabled={loading}
          className="w-full mt-2 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
        >
          Check-in
        </button>
      ) : (
        <>
          <button
            onClick={onCheckout}
            disabled={loading}
            className="w-full mt-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            Check-out
          </button>
          
          {/* 🆕 Botão de compartilhar guia */}
          {onShareGuide && (
            <button
              onClick={onShareGuide}
              className="w-full mt-1 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span>📱</span> Compartilhar Guia
            </button>
          )}
        </>
      )}

      <button
        onClick={onHistory}
        className="w-full mt-1 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        Histórico
      </button>
    </div>
  );
}