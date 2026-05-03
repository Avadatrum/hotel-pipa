// src/components/guestGuide/NavigationMenu.tsx

import { useRef } from 'react';
import type { GuideLanguage } from '../../types/guestGuide.types';
import { HomeIcon, RulesIcon, LocationIcon, CheckinIcon, WifiIcon, MoreIcon } from './icons';

export type SectionId = 'inicio' | 'regras' | 'como-chegar' | 'checkin' | 'wifi' | 'mais';

interface NavItem {
  id: SectionId;
  label: Record<GuideLanguage, string>;
  Icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: { pt: 'Início', es: 'Inicio', en: 'Home' }, Icon: HomeIcon },
  { id: 'regras', label: { pt: 'Regras', es: 'Reglas', en: 'Rules' }, Icon: RulesIcon },
  { id: 'como-chegar', label: { pt: 'Como chegar', es: 'Cómo llegar', en: 'How to get' }, Icon: LocationIcon },
  { id: 'checkin', label: { pt: 'Check-in', es: 'Check-in', en: 'Check-in' }, Icon: CheckinIcon },
  { id: 'wifi', label: { pt: 'Wi-Fi', es: 'Wi-Fi', en: 'Wi-Fi' }, Icon: WifiIcon },
  { id: 'mais', label: { pt: 'Mais', es: 'Más', en: 'More' }, Icon: MoreIcon },
];

interface NavigationMenuProps {
  language: GuideLanguage;
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

export function NavigationMenu({ language, activeSection, onNavigate }: NavigationMenuProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl safe-area-bottom">
      <div className="max-w-2xl mx-auto px-2">
        <div 
          ref={scrollRef}
          className="flex justify-between items-center py-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-300
                  min-w-[56px] flex-shrink-0
                  ${isActive 
                    ? 'text-amber-700' 
                    : 'text-stone-400 hover:text-stone-600'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-amber-100 scale-110' 
                    : 'bg-transparent'
                  }
                `}>
                  <item.Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-amber-800' : ''}`}>
                  {item.label[language]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}