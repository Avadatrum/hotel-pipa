// src/components/guestGuide/LoadingScreen.tsx

interface LoadingScreenProps {
  t: (key: string) => string; // 🆕 string em vez de TranslationKey
}

export function LoadingScreen({ t }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-nunito">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin" />
        <p className="text-stone-600 font-semibold text-base tracking-wide">{t('loading')}</p>
      </div>
    </div>
  );
}