import { Shield, User as UserIcon, AlertCircle, Users, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useHasPermission } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/github';
import { ROLE_DESCRIPTIONS } from '@/types/github';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

interface UserRoleInfo {
  username: string;
  role: UserRole;
  addedAt?: string;
  addedBy?: string;
}

export function RoleManagementView() {
  const canManageRoles = useHasPermission('canManageRoles');
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('developer');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Fetch user roles
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const response = await fetch('/api/get-user-roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      const data = await response.json();
      return data.users as UserRoleInfo[];
    },
    enabled: canManageRoles && !!token,
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: { username: string; role: UserRole }) => {
      const response = await fetch('/api/manage-user-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      setNewUsername('');
      setNewRole('developer');
      setIsAddingUser(false);
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch('/api/manage-user-role', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });

  const handleAddUser = () => {
    if (!newUsername.trim()) return;
    addUserMutation.mutate({ username: newUsername.trim(), role: newRole });
  };

  const handleRemoveUser = (username: string) => {
    if (confirm(`¿Seguro que quieres eliminar a @${username}?`)) {
      removeUserMutation.mutate(username);
    }
  };

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

      {/* Role Descriptions */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Roles Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_DESCRIPTIONS)
            .filter(([roleKey]) => roleKey !== 'superadmin') // Ocultar rol superadmin
            .map(([roleKey, roleInfo]) => {
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

      {/* Users List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Usuarios del Sistema
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Usuarios</CardTitle>
                <CardDescription>
                  Usuarios configurados con roles de admin y developer
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddingUser(!isAddingUser)}
                size="sm"
                variant={isAddingUser ? "outline" : "default"}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingUser ? 'Cancelar' : 'Agregar Usuario'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add User Form */}
            {isAddingUser && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="username">Usuario de GitHub</Label>
                    <Input
                      id="username"
                      placeholder="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rol</Label>
                    <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddUser}
                      disabled={!newUsername.trim() || addUserMutation.isPending}
                      className="w-full"
                    >
                      {addUserMutation.isPending ? 'Agregando...' : 'Agregar'}
                    </Button>
                  </div>
                </div>
                {addUserMutation.error && (
                  <p className="text-red-600 text-sm mt-2">
                    Error: {addUserMutation.error.message}
                  </p>
                )}
              </div>
            )}

            {/* Users List */}
            {isLoadingUsers ? (
              <p className="text-gray-500 text-center py-4">Cargando usuarios...</p>
            ) : !usersData || usersData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay usuarios configurados</p>
            ) : (
              <div className="space-y-2">
                {usersData.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">@{user.username}</p>
                        <p className="text-sm text-gray-500">
                          {ROLE_DESCRIPTIONS[user.role]?.name || user.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUser(user.username)}
                              disabled={removeUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar usuario</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
