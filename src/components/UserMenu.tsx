// src/components/UserMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { canManageUsers } = usePermission();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
          {user.name}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
          ({user.role === 'admin' ? 'Admin' : 'Operador'})
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-slide-up">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-800 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            <span className={`
              text-xs px-2 py-0.5 rounded-full mt-1 inline-block
              ${user.role === 'admin' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }
            `}>
              {user.role === 'admin' ? 'Administrador' : 'Operador'}
            </span>
          </div>
          
          {canManageUsers && (
            <button
              onClick={() => {
                navigate('/admin/usuarios');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              👥 Gerenciar Usuários
            </button>
          )}
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            🚪 Sair
          </button>
        </div>
      )}
    </div>
  );
}