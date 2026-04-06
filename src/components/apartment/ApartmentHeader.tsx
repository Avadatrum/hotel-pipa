// components/apartment/ApartmentHeader.tsx
interface ApartmentHeaderProps {
  aptNumber: number;
  isOccupied: boolean;
  onEditPhone?: () => void;
}

export function ApartmentHeader({ aptNumber, isOccupied, onEditPhone }: ApartmentHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-2">
      <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
        {aptNumber}
      </span>
      <div className="flex gap-1">
        {isOccupied && onEditPhone && (
          <button
            onClick={onEditPhone}
            className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Editar telefone"
          >
            ✏️
          </button>
        )}
        <span className={`
          w-2 h-2 rounded-full mt-1.5
          ${isOccupied ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
        `} />
      </div>
    </div>
  );
}