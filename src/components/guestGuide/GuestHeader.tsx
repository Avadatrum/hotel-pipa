// src/components/guestGuide/GuestHeader.tsx

interface GuestHeaderProps {
  guestName: string;
  aptNumber: number;
  towels: number;
  chips: number;
  t: (key: any) => string;
}

export function GuestHeader({ guestName, aptNumber, towels, chips, t }: GuestHeaderProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-amber-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-700 to-amber-900"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-amber-800 text-xs font-extrabold uppercase tracking-wider mb-1">{t('hello_welcome')}</p>
          <h1 className="text-3xl font-extrabold text-stone-800">{guestName}</h1>
        </div>
        <div className="bg-stone-800 text-white px-6 py-4 rounded-2xl shadow-md text-center min-w-[100px]">
          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">{t('suite')}</p>
          <p className="text-3xl font-extrabold">{aptNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatusBadge label={t('towels')} value={towels} color="amber" />
        <StatusBadge label={t('chips')} value={chips} color="stone" />
      </div>
    </div>
  );
}

function StatusBadge({ label, value, color }: { label: string; value: number; color: 'amber' | 'stone' }) {
  const styles = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-900', icon: 'text-amber-800' },
    stone: { bg: 'bg-stone-100', border: 'border-stone-200', text: 'text-stone-800', icon: 'text-stone-700' }
  };
  const s = styles[color];

  return (
    <div className={`${s.bg} rounded-2xl p-4 border ${s.border}`}>
      <p className={`text-xs font-bold ${s.text} uppercase mb-2`}>{label}</p>
      <p className="text-3xl font-bold text-stone-800">{value}</p>
    </div>
  );
}