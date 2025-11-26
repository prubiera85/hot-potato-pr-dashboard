import { useState } from 'react';
import { ChevronDown, ChevronRight, Flame, Zap, Clock, MessageSquare, GitPullRequest, RefreshCw, ExternalLink } from 'lucide-react';
import { EnhancedPR, GitHubUser } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamCreatedViewProps {
  prs: EnhancedPR[];
  maxDaysOpen: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface UserWorkload {
  user: GitHubUser;
  createdPRs: EnhancedPR[];
}

export function TeamCreatedView({ prs, maxDaysOpen, isLoading = false, onRefresh }: TeamCreatedViewProps) {
  // Group PRs by creator
  const userWorkloads = new Map<number, UserWorkload>();

  // Process all PRs to build user workloads
  prs.forEach((pr) => {
    if (!userWorkloads.has(pr.user.id)) {
      userWorkloads.set(pr.user.id, {
        user: pr.user,
        createdPRs: [],
      });
    }
    const workload = userWorkloads.get(pr.user.id)!;
    workload.createdPRs.push(pr);
  });

  // Convert to array and sort by created PRs (descending)
  const sortedWorkloads = Array.from(userWorkloads.values())
    .filter((w) => w.createdPRs.length > 0)
    .sort((a, b) => b.createdPRs.length - a.createdPRs.length);

  // Collapsible states
  const [openUsers, setOpenUsers] = useState<Set<number>>(new Set());

  const toggleUser = (userId: number) => {
    setOpenUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Helper to get color classes for PR status
  const getPRColorClasses = (pr: EnhancedPR) => {
    const hasAssignee = !pr.missingAssignee;
    const daysOpen = pr.hoursOpen / 24;
    const isOverMaxDays = daysOpen > maxDaysOpen;

    if (!hasAssignee) {
      if (isOverMaxDays) {
        return {
          textColor: 'text-red-700',
          bgColor: 'bg-white',
          borderColor: 'border-l-4 border-l-red-500',
        };
      } else {
        return {
          textColor: 'text-yellow-700',
          bgColor: 'bg-white',
          borderColor: 'border-l-4 border-l-yellow-500',
        };
      }
    }

    return {
      textColor: 'text-amber-800',
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-amber-600',
    };
  };

  const getTimeColorClass = (pr: EnhancedPR) => {
    const daysOpen = pr.hoursOpen / 24;
    const isOverMaxDays = daysOpen > maxDaysOpen;
    return isOverMaxDays ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
  };

  return (
    <div className="space-y-6 px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GitPullRequest className="w-8 h-8 text-orange-600" />
            PRs en Activo
          </h1>
          <p className="text-gray-600 mt-1">
            PRs activas creadas por cada usuario
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={isLoading ? 'animate-spin' : ''} />
          Refrescar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_150px] gap-4 px-6 py-3 bg-gray-100 border-b border-gray-200 font-semibold text-sm text-gray-700">
          <div>Usuario</div>
          <div className="text-center">PRs Creadas</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-200">
          {sortedWorkloads.map((workload) => {
            const isOpen = openUsers.has(workload.user.id);
            return (
              <Collapsible
                key={workload.user.id}
                open={isOpen}
                onOpenChange={() => toggleUser(workload.user.id)}
              >
                {/* User row */}
                <CollapsibleTrigger className="w-full hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-[1fr_150px] gap-4 px-6 py-4 items-center">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <img
                        src={workload.user.avatar_url}
                        alt={workload.user.login}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {workload.user.login}
                        </div>
                      </div>
                    </div>
                    <div className="text-center font-semibold text-gray-900">
                      {workload.createdPRs.length}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded PR list */}
                <CollapsibleContent>
                  <div className="bg-gray-50 px-6 py-2">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr className="text-xs text-gray-600">
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '150px' }}>Repositorio</th>
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '250px' }}>Pull Request</th>
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '150px' }}>Assignees</th>
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '150px' }}>Reviewers</th>
                          <th className="text-center py-2 px-3 font-semibold" style={{ width: '60px' }}>
                            <MessageSquare className="w-3.5 h-3.5 mx-auto" />
                          </th>
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '100px' }}>
                            <Clock className="w-3.5 h-3.5" />
                          </th>
                          <th className="text-left py-2 px-3 font-semibold" style={{ width: '80px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {workload.createdPRs.map((pr) => {
                          const colorClasses = getPRColorClasses(pr);
                          const timeColorClass = getTimeColorClass(pr);

                          return (
                            <tr
                              key={pr.id}
                              className={`${colorClasses.bgColor} hover:bg-gray-100`}
                              style={{
                                borderLeft: colorClasses.borderColor.includes('red') ? '4px solid rgb(248 113 113)'
                                  : colorClasses.borderColor.includes('yellow') ? '4px solid rgb(250 204 21)'
                                  : '4px solid rgb(180 83 9)',
                                borderBottom: '4px solid rgb(249 250 251)'
                              }}
                            >
                              {/* Repo */}
                              <td className="py-3 px-3 text-xs font-medium text-gray-700 whitespace-nowrap" style={{ width: '150px' }}>
                                {pr.repo.name}
                              </td>

                              {/* PR title with link */}
                              <td className="py-3 px-3" style={{ width: '250px' }}>
                                <a
                                  href={pr.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate"
                                  style={{ maxWidth: '230px' }}
                                  title={`#${pr.number} - ${pr.title}`}
                                >
                                  #{pr.number} - {pr.title}
                                </a>
                              </td>

                              {/* Assignees badges */}
                              <td className="py-3 px-3" style={{ width: '150px' }}>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {pr.assignees.length > 0 ? (
                                    pr.assignees.map((assignee) => (
                                      <span
                                        key={assignee.id}
                                        className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800"
                                      >
                                        {assignee.login}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">
                                      Sin assignee
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Reviewers badges */}
                              <td className="py-3 px-3" style={{ width: '150px' }}>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {pr.requested_reviewers.length > 0 ? (
                                    pr.requested_reviewers.map((reviewer) => (
                                      <span
                                        key={reviewer.id}
                                        className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800"
                                      >
                                        {reviewer.login}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700">
                                      Sin reviewers
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Comments */}
                              <td className="py-3 px-3 text-center" style={{ width: '60px' }}>
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-gray-600 cursor-help">
                                        {pr.commentCount}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs">
                                        <div>💬 {pr.issueComments} comentarios generales</div>
                                        <div>📝 {pr.reviewComments} comentarios de código</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>

                              {/* Time open */}
                              <td className="py-3 px-3" style={{ width: '100px' }}>
                                <span className={`text-xs ${timeColorClass} whitespace-nowrap`}>
                                  {formatTimeAgo(pr.hoursOpen)}
                                </span>
                              </td>

                              {/* Icons and GitHub button */}
                              <td className="py-3 px-3" style={{ width: '80px' }}>
                                <div className="flex items-center gap-1 justify-end">
                                  {pr.isUrgent && (
                                    <Flame className="w-3.5 h-3.5 text-red-600" fill="currentColor" />
                                  )}
                                  {pr.isQuick && (
                                    <Zap className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                                  )}
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <a
                                      href={pr.html_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {sortedWorkloads.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay PRs creadas por ningún usuario
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
