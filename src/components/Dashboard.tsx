import { useState, useMemo } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import type { EnhancedPR, SortOption, FilterOption } from '../types/github';
import { sortPRs } from '../utils/prHelpers';
import { PRCard } from './PRCard';

interface DashboardProps {
  prs: EnhancedPR[];
  isLoading: boolean;
  onToggleUrgent: (pr: EnhancedPR) => void;
  onRefresh: () => void;
}

export function Dashboard({ prs, isLoading, onToggleUrgent, onRefresh }: DashboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>('urgent-overdue');
  const [filter, setFilter] = useState<FilterOption>('all');

  // Filter PRs
  const filteredPRs = useMemo(() => {
    switch (filter) {
      case 'urgent':
        return prs.filter((pr) => pr.isUrgent);
      case 'overdue':
        return prs.filter((pr) => pr.status === 'overdue');
      case 'unassigned':
        return prs.filter((pr) => pr.missingAssignee || pr.missingReviewer);
      default:
        return prs;
    }
  }, [prs, filter]);

  // Sort PRs
  const sortedPRs = useMemo(() => {
    return sortPRs(filteredPRs, sortBy);
  }, [filteredPRs, sortBy]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: prs.length,
      urgent: prs.filter((pr) => pr.isUrgent).length,
      overdue: prs.filter((pr) => pr.status === 'overdue').length,
      unassigned: prs.filter((pr) => pr.missingAssignee || pr.missingReviewer).length,
      missingAssignee: prs.filter((pr) => pr.missingAssignee).length,
      missingReviewer: prs.filter((pr) => pr.missingReviewer).length,
    };
  }, [prs]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total PRs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-red-300">
          <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
          <div className="text-sm text-red-600">Urgentes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-red-300">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-red-500">Overdue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-yellow-300">
          <div className="text-2xl font-bold text-yellow-700">{stats.unassigned}</div>
          <div className="text-sm text-yellow-600">Sin asignar</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-orange-300">
          <div className="text-2xl font-bold text-orange-600">{stats.missingAssignee}</div>
          <div className="text-sm text-orange-500">Sin assignee</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-orange-300">
          <div className="text-2xl font-bold text-orange-600">{stats.missingReviewer}</div>
          <div className="text-sm text-orange-500">Sin reviewer</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Filtros:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas ({prs.length})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                filter === 'urgent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⭐ Urgentes ({stats.urgent})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🚨 Overdue ({stats.overdue})
            </button>
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                filter === 'unassigned'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sin asignar ({stats.unassigned})
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="urgent-overdue">Urgente + Overdue</option>
              <option value="time-open">Tiempo abierta</option>
              <option value="reviewers"># Reviewers</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 text-sm rounded font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Cargando...' : 'Refrescar'}</span>
          </button>
        </div>
      </div>

      {/* PR List */}
      <div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Cargando PRs...</div>
          </div>
        ) : sortedPRs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-600">
              {filter === 'all'
                ? 'No hay PRs abiertas'
                : `No hay PRs que coincidan con el filtro "${filter}"`}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando {sortedPRs.length} de {prs.length} PRs
            </div>
            {sortedPRs.map((pr) => (
              <PRCard key={`${pr.repo.owner}-${pr.repo.name}-${pr.number}`} pr={pr} onToggleUrgent={onToggleUrgent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
