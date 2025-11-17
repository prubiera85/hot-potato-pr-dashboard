import type { GitHubPullRequest, EnhancedPR, PRStatus, SortOption } from '../types/github';

export function calculatePRStatus(
  pr: GitHubPullRequest,
  timeLimit: number
): PRStatus {
  const hoursOpen = getHoursOpen(pr);
  const hasAssignee = pr.assignees.length > 0;
  const hasReviewer = pr.requested_reviewers.length > 0;

  // If both are assigned, status is always OK
  if (hasAssignee && hasReviewer) {
    return 'ok';
  }

  // Check if time limit exceeded (warning - yellow border)
  if (hoursOpen >= timeLimit) {
    return 'warning';
  }

  return 'ok';
}

export function getHoursOpen(pr: GitHubPullRequest): number {
  const now = Date.now();
  const created = new Date(pr.created_at).getTime();
  return (now - created) / (1000 * 60 * 60);
}

export function isUrgent(pr: GitHubPullRequest): boolean {
  return pr.labels.some(label => label.name.toLowerCase() === 'urgent');
}

export function isQuick(pr: GitHubPullRequest): boolean {
  return pr.labels.some(label => label.name.toLowerCase() === 'quick');
}

export function enhancePR(
  pr: GitHubPullRequest,
  owner: string,
  repo: string,
  timeLimit: number
): EnhancedPR {
  const hoursOpen = getHoursOpen(pr);
  const reviewerCount = pr.requested_reviewers.length;
  const missingAssignee = pr.assignees.length === 0;
  const missingReviewer = reviewerCount === 0;
  const urgent = isUrgent(pr);
  const quick = isQuick(pr);
  const status = calculatePRStatus(pr, timeLimit);

  return {
    ...pr,
    status,
    hoursOpen,
    missingAssignee,
    missingReviewer,
    reviewerCount,
    commentCount: 0,
    issueComments: 0,
    reviewComments: 0,
    isUrgent: urgent,
    isQuick: quick,
    repo: {
      owner,
      name: repo,
    },
  };
}

export function sortPRs(prs: EnhancedPR[], sortBy: SortOption): EnhancedPR[] {
  const sorted = [...prs];

  switch (sortBy) {
    case 'time-open-desc':
      return sorted.sort((a, b) => b.hoursOpen - a.hoursOpen);

    case 'time-open-asc':
      return sorted.sort((a, b) => a.hoursOpen - b.hoursOpen);

    default:
      return sorted;
  }
}

export function formatTimeAgo(hours: number): string {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
