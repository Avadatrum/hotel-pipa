// src/components/guestGuide/ScheduleItem.tsx

interface ScheduleItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function ScheduleItem({ label, value, highlight = false }: ScheduleItemProps) {
  return (
    <div className={`flex justify-between items-center py-3 px-4 rounded-2xl transition-colors ${
      highlight 
        ? 'bg-red-50 border border-red-100' 
        : 'bg-stone-50'
    }`}>
      <span className="text-sm font-bold text-stone-600">{label}</span>
      <span className={`text-sm font-bold ${
        highlight ? 'text-red-700' : 'text-stone-800'
      }`}>
        {value}
      </span>
    </div>
  );
}