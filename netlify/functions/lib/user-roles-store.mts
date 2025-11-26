import { getStore } from '@netlify/blobs';
import type { UserRole } from '../../../src/types/github';

export interface UserRoleEntry {
  username: string;
  role: UserRole;
  addedAt: string;
  addedBy?: string;
}

const STORE_NAME = 'user-roles';
const BLOB_KEY = 'roles';

/**
 * Get the blob store for user roles
 */
function getUserRolesStore() {
  return getStore(STORE_NAME);
}

/**
 * Get all user roles from blobs
 * Falls back to USER_ROLES env var if blob doesn't exist yet
 */
export async function getUserRoles(): Promise<UserRoleEntry[]> {
  const store = getUserRolesStore();

  try {
    const data = await store.get(BLOB_KEY, { type: 'json' });

    if (data && Array.isArray(data)) {
      return data as UserRoleEntry[];
    }

    // If no data in blob, try to migrate from env var
    return await migrateFromEnvVar();
  } catch (error) {
    console.error('Error reading user roles from blob:', error);
    // Fallback to env var
    return await migrateFromEnvVar();
  }
}

/**
 * Get role for a specific user
 */
export async function getUserRole(username: string): Promise<UserRole> {
  const users = await getUserRoles();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  return user?.role || 'guest';
}

/**
 * Save user roles to blob
 */
export async function saveUserRoles(users: UserRoleEntry[]): Promise<void> {
  const store = getUserRolesStore();
  await store.setJSON(BLOB_KEY, users);
}

/**
 * Add or update a user role
 */
export async function upsertUserRole(
  username: string,
  role: UserRole,
  addedBy?: string
): Promise<UserRoleEntry[]> {
  const users = await getUserRoles();

  const existingIndex = users.findIndex(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  const entry: UserRoleEntry = {
    username,
    role,
    addedAt: new Date().toISOString(),
    addedBy,
  };

  if (existingIndex >= 0) {
    users[existingIndex] = entry;
  } else {
    users.push(entry);
  }

  await saveUserRoles(users);
  return users;
}

/**
 * Remove a user role
 */
export async function removeUserRole(username: string): Promise<UserRoleEntry[]> {
  const users = await getUserRoles();
  const filtered = users.filter(
    u => u.username.toLowerCase() !== username.toLowerCase()
  );

  await saveUserRoles(filtered);
  return filtered;
}

/**
 * Migrate users from USER_ROLES env var to blob storage
 * This runs automatically on first access if blob is empty
 */
async function migrateFromEnvVar(): Promise<UserRoleEntry[]> {
  const rolesConfig = process.env.USER_ROLES;

  if (!rolesConfig) {
    return [];
  }

  const users: UserRoleEntry[] = [];
  rolesConfig.split(',').forEach(entry => {
    const [username, role] = entry.split(':').map(s => s.trim());
    if (username && role) {
      users.push({
        username,
        role: role as UserRole,
        addedAt: new Date().toISOString(),
        addedBy: 'migration',
      });
    }
  });

  // Save to blob for future use
  if (users.length > 0) {
    try {
      await saveUserRoles(users);
      console.log('Successfully migrated user roles from env var to blob storage');
    } catch (error) {
      console.error('Failed to save migrated users to blob:', error);
    }
  }

  return users;
}
