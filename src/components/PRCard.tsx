import { Star, ExternalLink, Zap, Loader2, Clock, GitPullRequest, MessageSquare, User, Eye, AlertCircle } from 'lucide-react';
import type { EnhancedPR } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/shadcn-io/avatar-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

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
}

export function PRCard({ pr: initialPR, onToggleUrgent, onToggleQuick, isProcessingUrgent, isProcessingQuick, maxDaysOpen }: PRCardProps) {
  // Local state for the PR to avoid reloading all PRs
  const [pr, setPr] = useState(initialPR);

  // Update local PR when prop changes
  useEffect(() => {
    setPr(initialPR);
  }, [initialPR]);

  // Calculate visual status
  const hasAssignee = !pr.missingAssignee;
  const hasReviewer = !pr.missingReviewer;
  const daysOpen = pr.hoursOpen / 24;
  const isOverMaxDays = daysOpen > maxDaysOpen;

  // Determine border color based on assignment status
  let borderColor = 'border-green-400';
  let borderLeftColor = 'border-l-green-400';
  let iconColor = 'text-green-600';

  if (!hasAssignee || !hasReviewer) {
    // Missing assignee or reviewer
    if (pr.status === 'warning') {
      // Over time limit - yellow warning
      borderColor = 'border-yellow-400';
      borderLeftColor = 'border-l-yellow-400';
      iconColor = 'text-yellow-600';
    } else {
      // Within time limit but missing - red
      borderColor = 'border-red-400';
      borderLeftColor = 'border-l-red-400';
      iconColor = 'text-red-600';
    }
  }

  const statusConfig = {
    icon: <GitPullRequest className={`w-6 h-6 ${iconColor}`} />,
    borderColor,
    borderLeftColor,
    textColor: hasAssignee && hasReviewer ? 'text-green-800' : 'text-red-800',
    timeColor: isOverMaxDays ? 'text-red-600 font-bold' : 'text-green-600 font-bold',
  };

  const status = statusConfig;

  return (
    <div className={`relative bg-white rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow border-2 ${status.borderColor} border-l-8 ${status.borderLeftColor}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {status.icon}
              <h4 className="text-md font-semibold text-gray-700">
              {pr.repo.name}
              </h4>
            </div>

            <div className="flex items-center gap-2 mb-2 ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <a
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  #{pr.number} - {pr.title}
                </a>
              </h3>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-3 gap-2 ml-4">
              <span className={`inline-flex items-center gap-1 ${status.timeColor}`}>
                <Clock className="w-4 h-4" />
                {formatTimeAgo(pr.hoursOpen)} abierta
                {!hasAssignee && ' (OVERDUE)'}
              </span>
              <span>•</span>
              <span className="text-gray-500">por {pr.user.login}</span>
              <span>•</span>
              <TooltipProvider>
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

            {pr.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pr.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      borderColor: `#${label.color}`,
                      borderWidth: '1px',
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons row at bottom */}
            <div className="flex gap-2 mt-4 ml-1">
              <Button
                asChild
                variant="link"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
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

          {/* Right sidebar - Assignment section */}
          <div className="w-64 flex-shrink-0 border-l border-gray-200 pl-4">
            {/* Assignees Section */}
            {/* <div className="mb-6"> */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Asignees</h4>
                </div>
                {pr.assignees.length === 0 ? (
                  <div className="flex items-center gap-1 text-sm text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4" />
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

              {/* <div>
                {isAssigningAssignees ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  <UserSelector
                    availableUsers={availableUsers}
                    selectedUserIds={pr.assignees.map(a => a.id)}
                    onToggleUser={handleToggleAssignee}
                  />
                )}
              </div> */}
            </div>

            {/* Reviewers Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Reviewers</h4>
                </div>
                {pr.requested_reviewers.length === 0 ? (
                  <div className="flex items-center gap-1 text-sm text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Sin reviewers</span>
                  </div>
                ) : ( 
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
                )}
              </div>

              {/* <div>
                {isAssigningReviewers ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  <UserSelector
                    availableUsers={availableReviewers}
                    selectedUserIds={pr.requested_reviewers.map(r => r.id)}
                    onToggleUser={handleToggleReviewer}
                  />
                )}
              </div> */}



            </div>
            {/* Botones de urgente y rápida Section */}
            
            <div className="flex gap-2"> <Button
                onClick={() => onToggleUrgent(pr)}
                disabled={isProcessingUrgent}
                variant={pr.isUrgent ? "destructive" : "outline"}
                size="sm"
                title={pr.isUrgent ? 'Quitar urgente' : 'Marcar como urgente'}
              >
                {isProcessingUrgent ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Star fill={pr.isUrgent ? 'currentColor' : 'none'} />
                    <span>Urgente</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => onToggleQuick(pr)}
                disabled={isProcessingQuick}
                variant={pr.isQuick ? "default" : "outline"}
                size="sm"
                className={pr.isQuick ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                title={pr.isQuick ? 'Quitar rápida' : 'Marcar como rápida'}
              >
                {isProcessingQuick ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Zap fill={pr.isQuick ? 'currentColor' : 'none'} />
                    <span>Rápida</span>
                  </>
                )}
              </Button></div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
