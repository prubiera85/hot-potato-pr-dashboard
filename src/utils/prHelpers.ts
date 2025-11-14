import type { GitHubPullRequest, EnhancedPR, PRStatus, SortOption } from '../types/github';

export function calculatePRStatus(
  pr: GitHubPullRequest,
  timeLimit: number,
  warningThreshold: number
): PRStatus {
  const hoursOpen = getHoursOpen(pr);
  const hasAssignee = pr.assignees.length > 0;
  const hasReviewer = pr.requested_reviewers.length > 0;

  // If both are assigned, status is always OK
  if (hasAssignee && hasReviewer) {
    return 'ok';
  }

  // Check if time limit exceeded
  if (hoursOpen >= timeLimit) {
    return 'overdue';
  }

  // Check if warning threshold reached
  const percentageOfTime = (hoursOpen / timeLimit) * 100;
  if (percentageOfTime >= warningThreshold) {
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

export function enhancePR(
  pr: GitHubPullRequest,
  owner: string,
  repo: string,
  timeLimit: number,
  warningThreshold: number
): EnhancedPR {
  const hoursOpen = getHoursOpen(pr);
  const reviewerCount = pr.requested_reviewers.length;
  const missingAssignee = pr.assignees.length === 0;
  const missingReviewer = reviewerCount === 0;
  const urgent = isUrgent(pr);
  const status = calculatePRStatus(pr, timeLimit, warningThreshold);

  return {
    ...pr,
    status,
    hoursOpen,
    missingAssignee,
    missingReviewer,
    reviewerCount,
    isUrgent: urgent,
    repo: {
      owner,
      name: repo,
    },
  };
}

export function sortPRs(prs: EnhancedPR[], sortBy: SortOption): EnhancedPR[] {
  const sorted = [...prs];

  switch (sortBy) {
    case 'urgent-overdue':
      return sorted.sort((a, b) => {
        // Urgent first
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        // Then overdue
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        // Then warning
        if (a.status === 'warning' && b.status === 'ok') return -1;
        if (a.status === 'ok' && b.status === 'warning') return 1;
        // Then by missing assignee/reviewer
        const aMissing = (a.missingAssignee ? 1 : 0) + (a.missingReviewer ? 1 : 0);
        const bMissing = (b.missingAssignee ? 1 : 0) + (b.missingReviewer ? 1 : 0);
        if (aMissing !== bMissing) return bMissing - aMissing;
        // Finally by time open
        return b.hoursOpen - a.hoursOpen;
      });

    case 'time-open':
      return sorted.sort((a, b) => b.hoursOpen - a.hoursOpen);

    case 'reviewers':
      return sorted.sort((a, b) => {
        // First by number of reviewers (ascending: 0, 1, 2+)
        if (a.reviewerCount !== b.reviewerCount) {
          return a.reviewerCount - b.reviewerCount;
        }
        // Then by time open
        return b.hoursOpen - a.hoursOpen;
      });

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
