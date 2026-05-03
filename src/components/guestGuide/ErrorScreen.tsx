// src/components/guestGuide/ErrorScreen.tsx

import { WarningIcon, RefreshIcon } from './icons';

interface ErrorScreenProps {
  message: string;
  t: (key: string) => string; // 🆕 string em vez de TranslationKey
}

export function ErrorScreen({ message, t }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-nunito">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-amber-100">
        <div className="mb-6">
          <WarningIcon className="w-8 h-8 text-amber-700 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-3">{t('error_title')}</h1>
        <p className="text-stone-500 mb-8 text-sm leading-relaxed">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3.5 bg-stone-800 text-white text-sm font-bold rounded-2xl hover:bg-stone-900 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshIcon className="w-5 h-5" /> {t('try_again')}
        </button>
      </div>
    </div>
  );
}