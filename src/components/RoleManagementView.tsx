import { Shield, User as UserIcon, Info, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useHasPermission } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/github';
import { ROLE_DESCRIPTIONS } from '@/types/github';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function RoleManagementView() {
  const canManageRoles = useHasPermission('canManageRoles');

  if (!canManageRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Gestión de Roles
          </h1>
          <p className="text-gray-600 mt-2">
            Administra los roles y permisos de los usuarios de la aplicación.
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-semibold mb-1">Acceso Denegado</p>
                <p>
                  No tienes permisos para acceder a la gestión de roles.
                  Solo los superadmins pueden gestionar roles de usuario.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Configuración de Roles</p>
              <p className="mb-2">
                Los roles se configuran mediante la variable de entorno <code className="bg-blue-100 px-1 rounded">USER_ROLES</code> en Netlify.
              </p>
              <p className="mb-2">
                <strong>Formato:</strong> <code className="bg-blue-100 px-1 rounded">username1:role1,username2:role2,...</code>
              </p>
              <p>
                <strong>Ejemplo:</strong> <code className="bg-blue-100 px-1 rounded">prubiera85:superadmin,john:admin,jane:developer</code>
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Los usuarios no especificados en la configuración tendrán el rol <strong>guest</strong> por defecto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      {Object.entries(roleInfo.permissions).map(([key, value]) => {
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

      {/* Command to update roles */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-semibold mb-2">Actualizar Roles</p>
              <p className="mb-2">
                Para modificar los roles de los usuarios, actualiza la variable de entorno en Netlify:
              </p>
              <code className="block bg-purple-100 p-2 rounded text-xs overflow-x-auto">
                netlify env:set USER_ROLES "prubiera85:superadmin,user2:admin,user3:developer"
              </code>
              <p className="mt-2 text-xs text-purple-700">
                Los cambios se aplicarán en el próximo login de cada usuario.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
