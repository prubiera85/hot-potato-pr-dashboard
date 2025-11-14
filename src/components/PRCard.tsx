import { StarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { EnhancedPR } from '../types/github';
import { formatTimeAgo } from '../utils/prHelpers';

interface PRCardProps {
  pr: EnhancedPR;
  onToggleUrgent: (pr: EnhancedPR) => void;
}

export function PRCard({ pr, onToggleUrgent }: PRCardProps) {
  const statusConfig = {
    ok: {
      icon: '✅',
      borderColor: 'border-green-400',
      borderLeftColor: 'border-l-green-400',
      textColor: 'text-green-800',
    },
    warning: {
      icon: '⚠️',
      borderColor: 'border-yellow-400',
      borderLeftColor: 'border-l-yellow-400',
      textColor: 'text-yellow-800',
    },
    overdue: {
      icon: '🚨',
      borderColor: 'border-red-400',
      borderLeftColor: 'border-l-red-400',
      textColor: 'text-red-800',
    },
  };

  const status = statusConfig[pr.status];

  return (
    <div className={`relative bg-white rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow border-2 ${status.borderColor} border-l-8 ${status.borderLeftColor}`}>
      <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{status.icon}</span>
            {pr.isUrgent && <span className="text-2xl">⭐</span>}
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
            <span className="font-medium">
              {pr.repo.owner}/{pr.repo.name}
            </span>
            {' • '}
            <span className={status.textColor}>
              {formatTimeAgo(pr.hoursOpen)} abierta
              {pr.status === 'overdue' && ' (OVERDUE)'}
            </span>
            {' • '}
            <span className="text-gray-500">por {pr.user.login}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className={pr.missingAssignee ? 'text-red-600 font-semibold' : 'text-green-600'}>
                {pr.missingAssignee ? '❌' : '✅'} Assignee:
              </span>
              {pr.assignees.length > 0 ? (
                <span className="text-gray-700">
                  {pr.assignees.map((a) => '@' + a.login).join(', ')}
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Sin asignar</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className={pr.missingReviewer ? 'text-red-600 font-semibold' : 'text-green-600'}>
                {pr.missingReviewer ? '❌' : '✅'} Reviewer:
              </span>
              {pr.requested_reviewers.length > 0 ? (
                <span className="text-gray-700">
                  {pr.requested_reviewers.map((r) => '@' + r.login).join(', ')} ({pr.reviewerCount})
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Sin reviewer</span>
              )}
            </div>
          </div>

          {pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
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
        </div>

        <div className="flex flex-col gap-2 ml-4 w-40">
          <button
            onClick={() => onToggleUrgent(pr)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium transition-colors w-full ${
              pr.isUrgent
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={pr.isUrgent ? 'Quitar urgente' : 'Marcar como urgente'}
          >
            {pr.isUrgent ? (
              <>
                <StarSolidIcon className="w-4 h-4" />
                <span>Urgente</span>
              </>
            ) : (
              <>
                <StarIcon className="w-4 h-4" />
                <span>Marcar urgente</span>
              </>
            )}
          </button>

          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-center w-full"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            <span>Ver en GitHub</span>
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
