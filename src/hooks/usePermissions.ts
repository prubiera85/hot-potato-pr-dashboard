import { useAuthStore } from '../stores/authStore';
import type { UserPermissions, UserRole } from '../types/github';
import { ROLE_PERMISSIONS } from '../types/github';

/**
 * Hook to access current user permissions
 * Returns the permissions object for the current user's role
 */
export function usePermissions(): UserPermissions {
  const { user } = useAuthStore();

  if (!user || !user.role) {
    return ROLE_PERMISSIONS.guest;
  }

  // Always get fresh permissions from ROLE_PERMISSIONS to avoid stale data
  return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.guest;
}

/**
 * Hook to check if user has a specific permission
 *
 * @example
 * const canEdit = useHasPermission('canToggleUrgentQuick');
 * if (canEdit) {
 *   // Show edit button
 * }
 */
export function useHasPermission(permission: keyof UserPermissions): boolean {
  const permissions = usePermissions();
  return permissions?.[permission] ?? false;
}

/**
 * Hook to get current user role
 */
export function useUserRole(): UserRole | null {
  const { user } = useAuthStore();
  return user?.role || null;
}

/**
 * Hook to check if user has a specific role or higher
 * Role hierarchy: guest < developer < admin < superadmin
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const { user } = useAuthStore();
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    developer: 1,
    admin: 2,
    superadmin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}
