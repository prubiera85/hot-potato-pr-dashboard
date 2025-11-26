import { Flame, ExternalLink, Zap, Loader2, Clock, GitPullRequest, MessageSquare, User, Eye, AlertCircle } from 'lucide-react';
import type { EnhancedPR } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/shadcn-io/avatar-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHasPermission } from '@/hooks/usePermissions';
import { UserSelector } from '@/components/ui/user-selector';

interface Collaborator {
  id: number;
  login: string;
  avatar_url: string;
}

interface PRCardProps {
  pr: EnhancedPR;
  onToggleUrgent: (pr: EnhancedPR) => void;
  onToggleQuick: (pr: EnhancedPR) => void;
  isProcessingUrgent: boolean;
  isProcessingQuick: boolean;
  maxDaysOpen: number;
  collaborators?: Collaborator[];
  onPRUpdated?: () => void;
  onToggleAssignee?: (pr: EnhancedPR, userId: number) => Promise<void>;
  onToggleReviewer?: (pr: EnhancedPR, userId: number) => Promise<void>;
  isProcessingAssignees?: boolean;
  isProcessingReviewers?: boolean;
}

export function PRCard({
  pr,
  onToggleUrgent,
  onToggleQuick,
  isProcessingUrgent,
  isProcessingQuick,
  maxDaysOpen,
  collaborators = [],
  onToggleAssignee,
  onToggleReviewer,
  isProcessingAssignees = false,
  isProcessingReviewers = false
}: PRCardProps) {
  // Check permissions
  const canToggleUrgentQuick = useHasPermission('canToggleUrgentQuick');
  const canManageAssignments = useHasPermission('canManageAssignees');

  // Handlers for assignee/reviewer changes
  const handleToggleAssignee = async (userId: number) => {
    if (onToggleAssignee) {
      await onToggleAssignee(pr, userId);
    }
  };

  const handleToggleReviewer = async (userId: number) => {
    if (onToggleReviewer) {
      await onToggleReviewer(pr, userId);
    }
  };

  // Calculate available users for assignees (only exclude bots, allow PR author)
  const availableUsers = collaborators.filter(
    (user) => user.login.toLowerCase().indexOf('[bot]') === -1
  );

  // Available reviewers exclude PR author (GitHub restriction), bots, and current assignees
  const availableReviewers = collaborators.filter(
    (user) =>
      user.id !== pr.user.id && // Exclude PR author
      user.login.toLowerCase().indexOf('[bot]') === -1 && // Exclude bots
      !pr.assignees.some((assignee) => assignee.id === user.id) // Exclude current assignees
  );

  // Calculate visual status
  const hasAssignee = !pr.missingAssignee;
  const daysOpen = pr.hoursOpen / 24;
  const isOverMaxDays = daysOpen > maxDaysOpen;

  // Determine border color based on assignee status only (reviewer doesn't affect)
  let borderColor = 'border-amber-700';
  let borderLeftColor = 'border-l-amber-700';
  let iconColor = 'text-amber-800'; // Potato brown color to match the border
  let textColor = 'text-amber-900';

  if (!hasAssignee) {
    // Missing assignee
    if (isOverMaxDays) {
      // No assignee AND over max days - RED (critical)
      borderColor = 'border-red-400';
      borderLeftColor = 'border-l-red-400';
      iconColor = 'text-red-600';
      textColor = 'text-red-800';
    } else {
      // No assignee but within time limit - YELLOW (warning)
      borderColor = 'border-yellow-400';
      borderLeftColor = 'border-l-yellow-400';
      iconColor = 'text-yellow-600';
      textColor = 'text-yellow-800';
    }
  }

  const statusConfig = {
    icon: <GitPullRequest className={`w-6 h-6 ${iconColor}`} />,
    borderColor,
    borderLeftColor,
    textColor,
    timeColor: isOverMaxDays ? 'text-red-600 font-bold' : 'text-green-600 font-bold',
  };

  const status = statusConfig;

  return (
    <div className={`relative bg-white rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow border-2 ${status.borderColor} border-l-8 ${status.borderLeftColor}`}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left side - Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header: Repo name + Urgent/Quick buttons */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {status.icon}
                <h4 className="text-md font-semibold text-gray-700">
                  {pr.repo.name}
                </h4>
              </div>

              {/* Urgent/Quick buttons - Solo visible para developer, admin y superadmin */}
              {canToggleUrgentQuick && (
                <div className="flex gap-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onToggleUrgent(pr)}
                          disabled={isProcessingUrgent}
                          variant={pr.isUrgent ? "destructive" : "outline"}
                          size="sm"
                        >
                          {isProcessingUrgent ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Flame fill={pr.isUrgent ? 'currentColor' : 'none'} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{pr.isUrgent ? 'Quitar urgente' : 'Marcar como urgente'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => onToggleQuick(pr)}
                          disabled={isProcessingQuick}
                          variant={pr.isQuick ? "default" : "outline"}
                          size="sm"
                          className={pr.isQuick ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          {isProcessingQuick ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Zap fill={pr.isQuick ? 'currentColor' : 'none'} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{pr.isQuick ? 'Quitar rápida' : 'Marcar como rápida'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Center: PR title, info, comments */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                <a
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  #{pr.number} - {pr.title}
                </a>
              </h3>

              <div className="flex items-center text-sm text-gray-600 mb-2 gap-2">
                <span className={`inline-flex items-center gap-1 ${status.timeColor}`}>
                  <Clock className={`w-4 h-4 ${isOverMaxDays ? 'animate-ring' : ''}`} />
                  {formatTimeAgo(pr.hoursOpen)} abierta
                </span>
                <span>•</span>
                <span className="text-gray-500">por {pr.user.login}</span>
                <span>•</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-gray-700 cursor-help">
                        <MessageSquare className="w-4 h-4" />
                        {pr.commentCount} comentarios
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
              </div>
            </div>

            {/* Footer: Ver en GitHub button */}
            <div className="flex gap-2 mt-auto pt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <a
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink />
                  <span>Ver en GitHub</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Right sidebar - Assignment section only */}
          <div className="w-64 flex-shrink-0 border-l border-gray-200 pl-4">
            {/* Assignees Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 min-h-[32px]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Asignees</h4>
                </div>
                {pr.assignees.length === 0 ? (
                  <div className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Sin asignar</span>
                  </div>
                ) : (
                  <AvatarGroup variant="motion" className="h-8 -space-x-2">
                    {pr.assignees.map((assignee) => (
                      <Avatar key={assignee.id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={assignee.avatar_url} alt={assignee.login} />
                        <AvatarFallback>{assignee.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                        <AvatarGroupTooltip>
                          <p>@{assignee.login}</p>
                        </AvatarGroupTooltip>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                )}
              </div>

              {canManageAssignments && (
                <div>
                  {isProcessingAssignees ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <UserSelector
                      availableUsers={availableUsers}
                      selectedUserIds={pr.assignees.map(a => a.id)}
                      onToggleUser={handleToggleAssignee}
                      placeholder="Asignar usuarios..."
                    />
                  )}
                </div>
              )}
            </div>

            {/* Reviewers Section */}
            <div>
              <div className="flex items-center justify-between mb-2 min-h-[32px]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Reviewers</h4>
                </div>
                {pr.requested_reviewers.length === 0 && (!pr.requested_teams || pr.requested_teams.length === 0) ? (
                  <div className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Sin reviewers</span>
                  </div>
                ) : (
                <div className="flex flex-col items-end gap-1">
                  <AvatarGroup variant="motion" className="h-8 -space-x-2">
                    {pr.requested_reviewers.map((reviewer) => (
                      <Avatar key={reviewer.id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={reviewer.avatar_url} alt={reviewer.login} />
                        <AvatarFallback>{reviewer.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                        <AvatarGroupTooltip>
                          <p>@{reviewer.login}</p>
                        </AvatarGroupTooltip>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  {pr.requested_teams && pr.requested_teams.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {pr.requested_teams.map((team, idx) => (
                        <span key={team.id}>
                          {idx > 0 && ', '}
                          @{team.slug}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                )}
              </div>

              {canManageAssignments && (
                <div>
                  {isProcessingReviewers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <UserSelector
                      availableUsers={availableReviewers}
                      selectedUserIds={pr.requested_reviewers.map(r => r.id)}
                      onToggleUser={handleToggleReviewer}
                      placeholder="Asignar reviewers..."
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
