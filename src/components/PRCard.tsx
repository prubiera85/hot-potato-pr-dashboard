import { Star, ExternalLink, Zap, Loader2, Clock, GitPullRequest, MessageSquare, User, Eye, AlertCircle } from 'lucide-react';
import type { EnhancedPR } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { UserSelector } from '@/components/ui/user-selector';
import { useState } from 'react';

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

export function PRCard({ pr, onToggleUrgent, onToggleQuick, isProcessingUrgent, isProcessingQuick, collaborators = [], onPRUpdated }: PRCardProps) {
  // Si tiene assignee, la card siempre es verde, solo cambia el icono del reloj
  const hasAssignee = !pr.missingAssignee;
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [isAssigningAssignees, setIsAssigningAssignees] = useState(false);
  const [isAssigningReviewers, setIsAssigningReviewers] = useState(false);

  // Use collaborators from API or fallback to empty array
  const availableUsers = collaborators;

  // Filter out PR author from reviewers (GitHub doesn't allow author as reviewer)
  const availableReviewers = availableUsers.filter(user => user.id !== pr.user.id);

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

  const handleToggleAssignee = async (userId: number) => {
    const user = availableUsers.find(u => u.id === userId);
    if (!user) return;

    const isCurrentlyAssigned = pr.assignees.some(a => a.id === userId);
    const action = isCurrentlyAssigned ? 'remove' : 'add';

    setIsAssigningAssignees(true);
    try {
      const response = await fetch('/api/assign-assignees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
          assignees: [user.login],
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign assignee');
      }

      // Refresh PR data
      onPRUpdated?.();
    } catch (error) {
      console.error('Error toggling assignee:', error);
    } finally {
      setIsAssigningAssignees(false);
    }
  };

  const handleToggleReviewer = async (userId: number) => {
    const user = availableUsers.find(u => u.id === userId);
    if (!user) return;

    const isCurrentlyReviewer = pr.requested_reviewers.some(r => r.id === userId);
    const action = isCurrentlyReviewer ? 'remove' : 'add';

    setIsAssigningReviewers(true);
    try {
      const response = await fetch('/api/assign-reviewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
          reviewers: [user.login],
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign reviewer');
      }

      // Refresh PR data
      onPRUpdated?.();
    } catch (error) {
      console.error('Error toggling reviewer:', error);
    } finally {
      setIsAssigningReviewers(false);
    }
  };

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
              <button
                onClick={() => onToggleUrgent(pr)}
                disabled={isProcessingUrgent}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded font-medium transition-colors ${
                  pr.isUrgent
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={pr.isUrgent ? 'Quitar urgente' : 'Marcar como urgente'}
              >
                {isProcessingUrgent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" fill={pr.isUrgent ? 'currentColor' : 'none'} />
                    <span>{pr.isUrgent ? 'Urgente' : 'Marcar urgente'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onToggleQuick(pr)}
                disabled={isProcessingQuick}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded font-medium transition-colors ${
                  pr.isQuick
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={pr.isQuick ? 'Quitar rápida' : 'Marcar como rápida'}
              >
                {isProcessingQuick ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" fill={pr.isQuick ? 'currentColor' : 'none'} />
                    <span>{pr.isQuick ? 'Rápida' : 'Marcar rápida'}</span>
                  </>
                )}
              </button>

              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ver en GitHub</span>
              </a>
            </div>
          </div>

          {/* Right sidebar - Assignment section */}
          <div className="w-64 flex-shrink-0 border-l border-gray-200 pl-4">
            {/* Assignees Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Asignados</h4>
                </div>
                <AvatarGroup users={pr.assignees} />
              </div>


              <div>
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
              </div>
            </div>

            {/* Reviewers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Reviewers</h4>
                </div>
                <AvatarGroup users={pr.requested_reviewers} />
              </div>

              <div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
