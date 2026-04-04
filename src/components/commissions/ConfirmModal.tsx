// src/components/commissions/ConfirmModal.tsx

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ 
  open, 
  title, 
  description, 
  confirmLabel = 'Confirmar', 
  danger = false, 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-[modal-in_0.2s_ease-out]">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <span className="text-2xl">{danger ? '🗑️' : '❓'}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}