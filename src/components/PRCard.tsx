import { Star, ExternalLink, Zap, Loader2, Clock, GitPullRequest, MessageSquare, User, Eye, AlertCircle } from 'lucide-react';
import type { EnhancedPR } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/shadcn-io/avatar-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  collaborators?: Collaborator[];
  onPRUpdated?: () => void;
}

export function PRCard({ pr: initialPR, onToggleUrgent, onToggleQuick, isProcessingUrgent, isProcessingQuick }: PRCardProps) {
  // Local state for the PR to avoid reloading all PRs
  const [pr, setPr] = useState(initialPR);

  // Update local PR when prop changes
  useEffect(() => {
    setPr(initialPR);
  }, [initialPR]);

  // Si tiene assignee, la card siempre es verde, solo cambia el icono del reloj
  const hasAssignee = !pr.missingAssignee;

  const getStatusIcon = () => {
    if (hasAssignee) {
      // Con assignee: GitPullRequest verde + reloj según estado
      if (pr.status === 'overdue') {
        return (
          <>
            <Clock className="w-6 h-6 text-red-600" />
            <GitPullRequest className="w-6 h-6 text-green-600" />
          </>
        );
      } else if (pr.status === 'warning') {
        return (
          <>
            <Clock className="w-6 h-6 text-yellow-600" />
            <GitPullRequest className="w-6 h-6 text-green-600" />
          </>
        );
      } else {
        return <GitPullRequest className="w-6 h-6 text-green-600" />;
      }
    } else {
      // Sin assignee: siempre rojo
      return (
        <>
          <Clock className="w-6 h-6 text-red-600" />
          <GitPullRequest className="w-6 h-6 text-red-600" />
        </>
      );
    }
  };

  const statusConfig = {
    icon: getStatusIcon(),
    borderColor: hasAssignee ? 'border-green-400' : 'border-red-400',
    borderLeftColor: hasAssignee ? 'border-l-green-400' : 'border-l-red-400',
    textColor: hasAssignee ? 'text-green-800' : 'text-red-800',
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
              {pr.isUrgent && <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />}
              {pr.isQuick && <Zap className="w-6 h-6 text-yellow-500" fill="currentColor" />}
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

            <div className="text-sm text-gray-600 mb-3">
              <span className="font-bold text-base text-gray-800">
                {pr.repo.name}
              </span>
              {' • '}
              <span className={status.textColor}>
                {formatTimeAgo(pr.hoursOpen)} abierta
                {!hasAssignee && ' (OVERDUE)'}
              </span>
              {' • '}
              <span className="text-gray-500">por {pr.user.login}</span>
              {' • '}
              <span className="text-gray-700">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                {pr.commentCount} comentarios
              </span>
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
            <div className="flex gap-2 mt-4">
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
