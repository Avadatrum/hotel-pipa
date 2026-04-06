// components/apartment/LanguageSelectionModal.tsx

type Language = 'pt' | 'es' | 'en';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  guestName?: string;
  onSelect: (language: Language) => void;
  onCancel: () => void;
}

export function LanguageSelectionModal({ 
  isOpen, 
  guestName, 
  onSelect, 
  onCancel 
}: LanguageSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
          Escolha o idioma da mensagem
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Selecione o idioma para enviar a mensagem de boas-vindas para {guestName}:
        </p>
        
        <div className="flex gap-2">
          <LanguageButton language="pt" label="Português" flag="🇧🇷" onClick={() => onSelect('pt')} />
          <LanguageButton language="es" label="Español" flag="🇪🇸" onClick={() => onSelect('es')} />
          <LanguageButton language="en" label="English" flag="🇺🇸" onClick={() => onSelect('en')} />
        </div>
        
        <button
          onClick={onCancel}
          className="w-full mt-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Subcomponente para cada botão de idioma
interface LanguageButtonProps {
  language: Language;
  label: string;
  flag: string;
  onClick: () => void;
}

function LanguageButton({ language, label, flag, onClick }: LanguageButtonProps) {
  // Mapeamento de cores por idioma
  const bgColorMap = {
    pt: 'bg-green-600 hover:bg-green-700',
    es: 'bg-yellow-600 hover:bg-yellow-700',
    en: 'bg-blue-600 hover:bg-blue-700'
  };
  
  const bgColor = bgColorMap[language];
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-white rounded-lg transition-colors font-medium ${bgColor}`}
    >
      {flag} {label}
    </button>
  );
}