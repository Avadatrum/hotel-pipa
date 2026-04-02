// src/hooks/usePermission.ts
import { useAuth } from '../contexts/AuthContext';

export function usePermission() {
  const { user, isAdmin } = useAuth();

  const canManageUsers = isAdmin;
  const canViewAdminPanel = isAdmin;
  const isOperator = user?.role === 'operator';
  const isAdminUser = isAdmin;

  return {
    canManageUsers,
    canViewAdminPanel,
    isOperator,
    isAdminUser,
  };
}