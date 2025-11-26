import type { Config } from '@netlify/functions';
import { requireAuth } from './auth/middleware.mts';
import { getUserRoles } from './lib/user-roles-store.mts';

export default async (request: Request) => {
  try {
    // Verificar autenticación y que el usuario tenga permisos de gestión de roles
    const user = await requireAuth(request);

    // Solo admin y superadmin pueden ver esta información
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener usuarios del blob storage
    const users = await getUserRoles();

    // Ordenar por rol (superadmin primero, luego admin, luego developer) y luego alfabéticamente
    const roleOrder: Record<string, number> = {
      'superadmin': 0,
      'admin': 1,
      'developer': 2,
      'guest': 3
    };

    users.sort((a, b) => {
      const roleCompare = (roleOrder[a.role] || 999) - (roleOrder[b.role] || 999);
      if (roleCompare !== 0) return roleCompare;
      return a.username.localeCompare(b.username);
    });

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/get-user-roles',
};
