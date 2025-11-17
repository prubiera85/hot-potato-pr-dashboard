export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
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
export type FilterOption = 'all' | 'urgent' | 'unassigned' | 'quick';
