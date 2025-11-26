export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubTeam {
  id: number;
  name: string;
  slug: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  requested_teams?: GitHubTeam[];
  labels: GitHubLabel[];
  draft: boolean;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export type PRStatus = 'ok' | 'warning' | 'overdue';

export interface EnhancedPR extends GitHubPullRequest {
  // Computed metadata
  status: PRStatus;
  hoursOpen: number;
  missingAssignee: boolean;
  missingReviewer: boolean;
  reviewerCount: number;
  commentCount: number;
  issueComments: number;
  reviewComments: number;
  isUrgent: boolean;
  isQuick: boolean;

  // Repository info
  repo: {
    owner: string;
    name: string;
  };
}

export interface Repository {
  owner: string;
  name: string;
  enabled: boolean;
}

export interface DashboardConfig {
  assignmentTimeLimit: number; // max hours without assignee/reviewer (shows warning)
  maxDaysOpen: number; // max days a PR should be open (e.g., 5)
  repositories: Repository[];
}

export type SortOption = 'time-open-desc' | 'time-open-asc';
export type FilterOption = 'all' | 'urgent' | 'unassigned' | 'quick' | 'missing-assignee' | 'missing-reviewer';

// User roles
export type UserRole = 'superadmin' | 'admin' | 'developer' | 'guest';

export interface UserPermissions {
  canViewDashboard: boolean;           // Todos pueden ver
  canToggleUrgentQuick: boolean;       // developer, admin, superadmin
  canManageAssignees: boolean;         // developer, admin, superadmin
  canAccessConfig: boolean;            // admin, superadmin (incluye gestión de roles)
  canManageRepositories: boolean;      // admin, superadmin
  canAccessGamification: boolean;      // solo superadmin
}

export interface RoleConfig {
  name: string;
  description: string;
  permissions: UserPermissions;
}

// Role configurations
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  superadmin: {
    canViewDashboard: true,
    canToggleUrgentQuick: true,
    canManageAssignees: true,
    canAccessConfig: true,
    canManageRepositories: true,
    canAccessGamification: true,
  },
  admin: {
    canViewDashboard: true,
    canToggleUrgentQuick: true,
    canManageAssignees: true,
    canAccessConfig: true,
    canManageRepositories: true,
    canAccessGamification: false,
  },
  developer: {
    canViewDashboard: true,
    canToggleUrgentQuick: true,
    canManageAssignees: true,
    canAccessConfig: false,
    canManageRepositories: false,
    canAccessGamification: false,
  },
  guest: {
    canViewDashboard: true,
    canToggleUrgentQuick: false,
    canManageAssignees: false,
    canAccessConfig: false,
    canManageRepositories: false,
    canAccessGamification: false,
  },
};

export const ROLE_DESCRIPTIONS: Record<UserRole, RoleConfig> = {
  superadmin: {
    name: 'Superadmin',
    description: 'Acceso completo incluyendo gamificación',
    permissions: ROLE_PERMISSIONS.superadmin,
  },
  admin: {
    name: 'Admin',
    description: 'Gestión de configuración, roles y todas las opciones de developer',
    permissions: ROLE_PERMISSIONS.admin,
  },
  developer: {
    name: 'Developer',
    description: 'Puede ver y editar PRs (urgente/rápida, assignees, reviewers)',
    permissions: ROLE_PERMISSIONS.developer,
  },
  guest: {
    name: 'Guest',
    description: 'Solo visualización de PRs sin permisos de edición',
    permissions: ROLE_PERMISSIONS.guest,
  },
};
