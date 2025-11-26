import type { Config } from '@netlify/functions';
import { requireAuth } from './auth/middleware.mts';
import { upsertUserRole, removeUserRole, getUserRoles } from './lib/user-roles-store.mts';
import type { UserRole } from '../../src/types/github';

interface AddUserRequest {
  username: string;
  role: UserRole;
}

interface RemoveUserRequest {
  username: string;
}

export default async (request: Request) => {
  try {
    // Verificar autenticación
    const currentUser = await requireAuth(request);

    // Solo admin y superadmin pueden gestionar usuarios
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const method = request.method;

    // GET - Listar usuarios
    if (method === 'GET') {
      const users = await getUserRoles();

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST - Agregar o actualizar usuario
    if (method === 'POST') {
      const body = await request.json() as AddUserRequest;

      if (!body.username || !body.role) {
        return new Response(
          JSON.stringify({ error: 'Missing username or role' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validar que el rol sea válido
      const validRoles: UserRole[] = ['admin', 'developer'];
      if (!validRoles.includes(body.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be: admin or developer' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // No permitir que alguien se asigne a sí mismo como superadmin
      if (body.role === 'superadmin') {
        return new Response(
          JSON.stringify({ error: 'Cannot assign superadmin role' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const users = await upsertUserRole(
        body.username,
        body.role,
        currentUser.login
      );

      return new Response(
        JSON.stringify({
          success: true,
          users
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Eliminar usuario
    if (method === 'DELETE') {
      const body = await request.json() as RemoveUserRequest;

      if (!body.username) {
        return new Response(
          JSON.stringify({ error: 'Missing username' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // No permitir que alguien se elimine a sí mismo
      if (body.username.toLowerCase() === currentUser.login.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: 'Cannot remove yourself' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const users = await removeUserRole(body.username);

      return new Response(
        JSON.stringify({
          success: true,
          users
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing user role:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config: Config = {
  path: '/api/manage-user-role',
};
