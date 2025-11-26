import type { Config } from '@netlify/functions';
import * as Netlify from '@netlify/functions';
import { requireAuth } from './auth/middleware.mts';
import type { UserRole } from '../../src/types/github';

interface UserRoleInfo {
  username: string;
  role: UserRole;
}

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

    // Obtener la configuración de roles
    const rolesConfig = Netlify.env.get('USER_ROLES');
    if (!rolesConfig) {
      return new Response(
        JSON.stringify({ users: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parsear la configuración
    const users: UserRoleInfo[] = [];
    rolesConfig.split(',').forEach(entry => {
      const [username, role] = entry.split(':').map(s => s.trim());
      if (username && role && role !== 'superadmin') { // Excluir superadmin
        users.push({
          username,
          role: role as UserRole
        });
      }
    });

    // Ordenar por rol (admin primero, luego developer) y luego alfabéticamente
    const roleOrder: Record<string, number> = {
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
