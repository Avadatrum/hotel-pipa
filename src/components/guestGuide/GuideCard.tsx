// src/components/guestGuide/GuideCard.tsx

import { useState } from 'react';

interface GuideCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function GuideCard({ icon: Icon, title, children, defaultOpen = false }: GuideCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden mb-4 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group active:bg-stone-100"
      >
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 text-amber-800 p-2.5 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <span className="font-bold text-stone-800 text-lg">{title}</span>
        </div>
        <span className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-0 text-stone-600 text-sm leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}