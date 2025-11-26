import { User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useHasPermission } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/github';
import { ROLE_DESCRIPTIONS } from '@/types/github';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function RoleManagementView() {
  const canManageRoles = useHasPermission('canManageRoles');

  if (!canManageRoles) {
    return null;
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600 text-white hover:bg-purple-700';
      case 'admin':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'developer':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'guest':
        return 'bg-gray-400 text-white hover:bg-gray-500';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-purple-600" />
          Gestión de Roles
        </h1>
        <p className="text-gray-600 mt-2">
          Administra los roles y permisos de los usuarios de la aplicación.
        </p>
      </div>

      {/* Role Descriptions */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Roles Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, roleInfo]) => {
            const role = roleKey as UserRole;
            return (
              <Card key={role} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      {roleInfo.name}
                    </CardTitle>
                    <Badge className={getRoleBadgeColor(role)}>
                      {role}
                    </Badge>
                  </div>
                  <CardDescription>{roleInfo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Permisos:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(roleInfo.permissions)
                        .filter(([key]) => key !== 'canAccessGamification') // Ocultar permiso de gamificación
                        .map(([key, value]) => {
                        const permissionLabels: Record<string, string> = {
                          canViewDashboard: 'Ver dashboard',
                          canToggleUrgentQuick: 'Marcar urgente/rápida',
                          canManageAssignees: 'Gestionar assignees/reviewers',
                          canAccessConfig: 'Acceder a configuración',
                          canManageRepositories: 'Gestionar repositorios',
                          canManageRoles: 'Gestionar roles',
                        };

                        return (
                          <TooltipProvider key={key} delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 text-sm">
                                  {value ? (
                                    <span className="text-green-600 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400">✗</span>
                                  )}
                                  <span className={value ? 'text-gray-700' : 'text-gray-400'}>
                                    {permissionLabels[key] || key}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{value ? 'Permitido' : 'No permitido'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
