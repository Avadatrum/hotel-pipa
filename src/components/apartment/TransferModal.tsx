import { useState, useMemo } from 'react';
import { useApartments } from '../../hooks/useApartments';

interface TransferModalProps {
  isOpen: boolean;
  fromAptNumber: number;
  guestName: string;
  currentPax: number;
  currentChips: number;
  currentTowels: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (toAptNumber: number) => void;
}

export function TransferModal({
  isOpen,
  fromAptNumber,
  guestName,
  currentPax,
  currentChips,
  currentTowels,
  loading,
  onClose,
  onConfirm,
}: TransferModalProps) {
  const { apartments } = useApartments();
  const [selectedApt, setSelectedApt] = useState<number | null>(null);

  // Lista de apartamentos vagos (excluindo o atual)
  const vacantApts = useMemo(() => {
    return Object.entries(apartments)
      .filter(([num, data]) => {
        const aptNum = parseInt(num);
        return aptNum !== fromAptNumber && !data.occupied;
      })
      .map(([num]) => parseInt(num))
      .sort((a, b) => a - b);
  }, [apartments, fromAptNumber]);

  const handleSubmit = () => {
    if (selectedApt === null) return;
    onConfirm(selectedApt);
  };

  const handleClose = () => {
    setSelectedApt(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-md mx-auto animate-slide-up">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl">
            🔄
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Transferir Hóspede
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Saindo do Apto {fromAptNumber}
            </p>
          </div>
        </div>

        {/* Resumo do hóspede */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Hóspede:</span>
              <p className="font-medium text-gray-800 dark:text-white">{guestName}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Hóspedes:</span>
              <p className="font-medium text-gray-800 dark:text-white">{currentPax}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Fichas:</span>
              <p className="font-medium text-purple-600 dark:text-purple-400">🎫 {currentChips}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Toalhas:</span>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">🧺 {currentTowels}</p>
            </div>
          </div>
        </div>

        {/* Selecionar apartamento de destino */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Transferir para o apartamento:
          </label>

          {vacantApts.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                😕 Nenhum apartamento vago disponível
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {vacantApts.map((aptNum) => {
                const isSelected = selectedApt === aptNum;
                const apt = apartments[aptNum];
                const blockName = apt?.block || '';

                return (
                  <button
                    key={aptNum}
                    onClick={() => setSelectedApt(aptNum)}
                    className={`
                      p-3 rounded-lg text-center transition-all duration-200
                      ${isSelected
                        ? 'bg-green-600 text-white shadow-md scale-105'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                      }
                    `}
                  >
                    <p className={`text-lg font-bold ${
                      isSelected ? 'text-white' : 'text-gray-800 dark:text-white'
                    }`}>
                      {aptNum}
                    </p>
                    {blockName && (
                      <p className={`text-[10px] leading-tight mt-0.5 ${
                        isSelected ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {blockName}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo da transferência */}
        {selectedApt && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              🔄 <strong>{guestName}</strong> será transferido do 
              <strong> Apto {fromAptNumber}</strong> para o 
              <strong> Apto {selectedApt}</strong>
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✅ Fichas e toalhas serão mantidos • Apto {fromAptNumber} será liberado
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                     text-gray-700 dark:text-gray-200 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedApt === null}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Transferindo...
              </>
            ) : (
              <>
                🔄 Confirmar Transferência
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}