//src/components/serviceOrders/OSStatusBadge.tsx
import { type OSStatus } from '../../types/serviceOrder.types';
import { getOSStatusConfig } from '../../utils/osHelpers';

interface OSStatusBadgeProps {
  status: OSStatus;
  size?: 'sm' | 'md' | 'lg';
  withDot?: boolean;
}

export function OSStatusBadge({ status, size = 'md', withDot = true }: OSStatusBadgeProps) {
  const config = getOSStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${config.bgColor} ${config.color}
      ${sizeClasses[size]}
      dark:bg-opacity-20 dark:bg-gray-800
      transition-all duration-200
    `}>
      {withDot && (
        <span className={`
          rounded-full ${dotSizes[size]}
          ${status === 'em_andamento' ? 'animate-pulse' : ''}
          ${status === 'aberta' ? 'bg-blue-600' : ''}
          ${status === 'em_andamento' ? 'bg-yellow-600' : ''}
          ${status === 'concluida' ? 'bg-green-600' : ''}
          ${status === 'cancelada' ? 'bg-gray-600' : ''}
        `} />
      )}
      {config.label}
    </span>
  );
}