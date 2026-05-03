// src/components/guestGuide/PDFCard.tsx

interface PDFCardProps {
  Icon: React.FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  onClick: () => void;
}

export function PDFCard({ Icon, title, subtitle, onClick }: PDFCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-3xl shadow-sm border border-stone-100 p-5 flex items-center justify-between hover:bg-amber-50 hover:border-amber-100 transition-all hover:shadow-md group mb-4 active:scale-[0.99] text-left"
    >
      <div className="flex items-center gap-4">
        <div className="bg-amber-50 text-amber-800 p-2.5 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <span className="font-bold text-stone-800 text-lg block">{title}</span>
          {subtitle && <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{subtitle}</span>}
        </div>
      </div>
      <span className="bg-stone-100 text-stone-400 p-2 rounded-full group-hover:bg-amber-800 group-hover:text-white transition-colors">
        →
      </span>
    </button>
  );
}