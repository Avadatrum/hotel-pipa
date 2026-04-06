// components/apartment/ApartmentItemsControl.tsx

interface ApartmentItemsControlProps {
  chips: number;
  towels: number;
  loading: boolean;
  onAdjust: (item: 'chips' | 'towels', delta: number) => void;
}

export function ApartmentItemsControl({ 
  chips, 
  towels, 
  loading, 
  onAdjust 
}: ApartmentItemsControlProps) {
  return (
    <div className="space-y-1 mb-2">
      {/* Controle de Fichas */}
      <ItemControl
        label="Fichas"
        value={chips}
        loading={loading}
        onAdjust={(delta) => onAdjust('chips', delta)}
        disableDecrement={chips === 0}
      />
      
      {/* Controle de Toalhas */}
      <ItemControl
        label="Toalhas"
        value={towels}
        loading={loading}
        onAdjust={(delta) => onAdjust('towels', delta)}
        disableDecrement={towels === 0}
      />
    </div>
  );
}

// Subcomponente para cada item
interface ItemControlProps {
  label: string;
  value: number;
  loading: boolean;
  disableDecrement?: boolean;
  onAdjust: (delta: number) => void;
}

function ItemControl({ label, value, loading, disableDecrement, onAdjust }: ItemControlProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAdjust(-1)}
          disabled={loading || disableDecrement}
          className="w-7 h-7 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors text-sm"
        >
          -
        </button>
        <span className="font-bold w-6 text-center text-base dark:text-white">{value}</span>
        <button
          onClick={() => onAdjust(1)}
          disabled={loading}
          className="w-7 h-7 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}