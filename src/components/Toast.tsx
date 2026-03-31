// src/components/Toast.tsx
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      ${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg
      flex items-center gap-2 min-w-[200px] max-w-[350px]
      animate-slide-up
    `}>
      <span>{icons[type]}</span>
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        ✕
      </button>
    </div>
  );
}