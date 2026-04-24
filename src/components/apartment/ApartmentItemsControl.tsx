// src/components/apartment/ApartmentItemsControl.tsx - VERSÃO FINAL

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
      {/* Controle de Fichas - APENAS REMOVER */}
      <ItemControl
        label="Fichas"
        value={chips}
        icon="🎫"
        loading={loading}
        onRemove={() => onAdjust('chips', -1)}
        disabled={chips === 0}
        hint="Remover ficha → Entrega toalha"
      />
      
      {/* Controle de Toalhas - APENAS REMOVER */}
      <ItemControl
        label="Toalhas"
        value={towels}
        icon="🧺"
        loading={loading}
        onRemove={() => onAdjust('towels', -1)}
        disabled={towels === 0}
        hint="Remover toalha → Devolve ficha"
      />
    </div>
  );
}

// Subcomponente simplificado
interface ItemControlProps {
  label: string;
  value: number;
  icon: string;
  loading: boolean;
  disabled?: boolean;
  hint?: string;
  onRemove: () => void;
}

function ItemControl({ label, value, icon, loading, disabled, hint, onRemove }: ItemControlProps) {
  return (
    <div className="flex items-center justify-between text-xs group">
      <div className="flex items-center gap-1">
        <span className="dark:text-gray-300">{label}</span>
        {hint && (
          <span className="hidden group-hover:inline text-[10px] text-gray-400 dark:text-gray-500">
            ({hint})
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRemove}
          disabled={loading || disabled}
          className="w-8 h-8 bg-red-500 text-white rounded-lg disabled:opacity-30 hover:bg-red-600 transition-colors text-sm font-bold flex items-center justify-center"
          title={hint}
        >
          {icon}
        </button>
        <span className="font-bold w-6 text-center text-base dark:text-white">{value}</span>
      </div>
    </div>
  );
}