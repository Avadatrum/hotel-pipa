// src/pages/ApartmentsPage.tsx
import { useState } from 'react';
import { useApartments } from '../hooks/useApartments';
import { ApartmentCard } from '../components/ApartmentCard';
import { useToast } from '../hooks/useToast';

const BLOCKS = [
  { name: 'Frente Mar', apts: [1, 2, 3, 4, 5, 6, 7] },
  { name: 'Suite Premium Frente Mar', apts: [8] },
  { name: 'Luxo Frente Mar', apts: [10, 11, 12] },
  { name: 'Suite Premium Vista Parcial', apts: [21, 22, 23, 24, 25, 26, 27, 28, 29] },
  { name: 'Vista Parcial do Mar', apts: [31, 32, 33, 34, 35] },
  { name: 'Vista Jardim', apts: [41, 42, 43, 44, 45, 46, 47] },
];

// Tipos de filtro disponíveis
type FilterType = 'all' | 'occupied' | 'vacant' | 'withTowels' | 'withoutTowels' | 'withChips' | 'withoutChips';

export function ApartmentsPage() {
  const { apartments, loading } = useApartments();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');

  // Função que verifica se o apartamento deve ser mostrado
  const shouldShowApt = (aptNum: number): boolean => {
    const apt = apartments[aptNum];
    if (!apt) return false;
    
    switch (filter) {
      case 'occupied':
        return apt.occupied;
      case 'vacant':
        return !apt.occupied;
      case 'withTowels':
        return apt.occupied && apt.towels > 0;
      case 'withoutTowels':
        return apt.occupied && apt.towels === 0;
      case 'withChips':
        return apt.occupied && apt.chips > 0;
      case 'withoutChips':
        return apt.occupied && apt.chips === 0;
      default:
        return true;
    }
  };

  // Contagem de apartamentos por categoria (para mostrar badges)
  const counts = {
    total: Object.keys(apartments).length,
    occupied: Object.values(apartments).filter(a => a.occupied).length,
    vacant: Object.values(apartments).filter(a => !a.occupied).length,
    withTowels: Object.values(apartments).filter(a => a.occupied && a.towels > 0).length,
    withChips: Object.values(apartments).filter(a => a.occupied && a.chips > 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-pulse">🌴</div>
          <p className="text-gray-500 dark:text-gray-400">Carregando apartamentos...</p>
        </div>
      </div>
    );
  }

  // Definição dos botões de filtro
  const filterButtons: { id: FilterType; label: string; icon: string; color: string }[] = [
    { id: 'all', label: 'Todos', icon: '🏠', color: 'blue' },
    { id: 'occupied', label: 'Ocupados', icon: '👥', color: 'green' },
    { id: 'vacant', label: 'Vagos', icon: '🔓', color: 'gray' },
    { id: 'withTowels', label: 'Com Toalhas', icon: '🧺', color: 'yellow' },
    { id: 'withoutTowels', label: 'Sem Toalhas', icon: '🚫🧺', color: 'orange' },
    { id: 'withChips', label: 'Com Fichas', icon: '🎫', color: 'purple' },
    { id: 'withoutChips', label: 'Sem Fichas', icon: '🚫🎫', color: 'red' },
  ];

  const getButtonClass = (buttonId: FilterType) => {
    const isActive = filter === buttonId;
    const baseClass = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5";
    
    if (isActive) {
      switch (buttonId) {
        case 'all': return `${baseClass} bg-blue-600 text-white shadow-md`;
        case 'occupied': return `${baseClass} bg-green-600 text-white shadow-md`;
        case 'vacant': return `${baseClass} bg-gray-600 text-white shadow-md`;
        case 'withTowels': return `${baseClass} bg-yellow-600 text-white shadow-md`;
        case 'withoutTowels': return `${baseClass} bg-orange-600 text-white shadow-md`;
        case 'withChips': return `${baseClass} bg-purple-600 text-white shadow-md`;
        case 'withoutChips': return `${baseClass} bg-red-600 text-white shadow-md`;
        default: return `${baseClass} bg-blue-600 text-white shadow-md`;
      }
    }
    
    return `${baseClass} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105`;
  };

  return (
    <div className="space-y-5">
      {/* Filtros - agora com mais opções */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={getButtonClass(btn.id)}
            >
              <span className="text-base">{btn.icon}</span>
              <span>{btn.label}</span>
              {/* Mostrar contagem nos filtros que fazem sentido */}
              {btn.id === 'all' && (
                <span className="ml-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                  {counts.total}
                </span>
              )}
              {btn.id === 'occupied' && counts.occupied > 0 && (
                <span className="ml-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                  {counts.occupied}
                </span>
              )}
              {btn.id === 'vacant' && counts.vacant > 0 && (
                <span className="ml-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                  {counts.vacant}
                </span>
              )}
              {btn.id === 'withTowels' && counts.withTowels > 0 && (
                <span className="ml-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                  {counts.withTowels}
                </span>
              )}
              {btn.id === 'withChips' && counts.withChips > 0 && (
                <span className="ml-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                  {counts.withChips}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Resumo rápido do filtro atual */}
        {filter !== 'all' && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>🔍 Filtro ativo:</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {filterButtons.find(b => b.id === filter)?.label}
            </span>
            <button
              onClick={() => setFilter('all')}
              className="text-blue-500 hover:text-blue-700 ml-auto"
            >
              Limpar filtro ✕
            </button>
          </div>
        )}
      </div>

      {/* Blocos de apartamentos */}
      {BLOCKS.map(block => {
        const blockApts = block.apts.filter(aptNum => 
          apartments[aptNum] && shouldShowApt(aptNum)
        );
        
        if (blockApts.length === 0) return null;

        return (
          <div key={block.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-yellow-500 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{block.name}</h2>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                {blockApts.length} apts
              </span>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {blockApts.map(aptNum => {
                const apt = apartments[aptNum];
                if (!apt) return null;

                return (
                  <ApartmentCard
                    key={aptNum}
                    aptNumber={aptNum}
                    data={apt}
                    onSuccess={() => {}}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Mensagem quando nenhum apartamento corresponde ao filtro */}
      {BLOCKS.every(block => 
        block.apts.filter(aptNum => apartments[aptNum] && shouldShowApt(aptNum)).length === 0
      ) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">Nenhum apartamento encontrado</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum apartamento corresponde ao filtro "{filterButtons.find(b => b.id === filter)?.label}"
          </p>
          <button
            onClick={() => setFilter('all')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Mostrar todos
          </button>
        </div>
      )}
    </div>
  );
}