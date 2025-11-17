import { useState, useMemo, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import type { EnhancedPR, SortOption, FilterOption } from '../types/github';
import { sortPRs } from '../utils/prHelpers';
import { PRCard } from './PRCard';
import { Button } from './ui/button';

interface DashboardProps {
  prs: EnhancedPR[];
  isLoading: boolean;
  onToggleUrgent: (pr: EnhancedPR) => void;
  onToggleQuick: (pr: EnhancedPR) => void;
  onRefresh: () => void;
  isProcessingUrgent: (pr: EnhancedPR) => boolean;
  isProcessingQuick: (pr: EnhancedPR) => boolean;
}

export function Dashboard({ prs, isLoading, onToggleUrgent, onToggleQuick, onRefresh, isProcessingUrgent, isProcessingQuick }: DashboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>('urgent-overdue');
  const [selectedFilters, setSelectedFilters] = useState<Set<FilterOption>>(new Set());
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target as Node)) {
        setIsRepoDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique repositories
  const repositories = useMemo(() => {
    const repoSet = new Set<string>();
    prs.forEach((pr) => {
      repoSet.add(`${pr.repo.owner}/${pr.repo.name}`);
    });
    return Array.from(repoSet).sort();
  }, [prs]);

  // Get unique repos for fetching collaborators
  const uniqueRepos = useMemo(() => {
    const repos = new Map<string, { owner: string; repo: string }>();
    prs.forEach((pr) => {
      const key = `${pr.repo.owner}/${pr.repo.name}`;
      if (!repos.has(key)) {
        repos.set(key, { owner: pr.repo.owner, repo: pr.repo.name });
      }
    });
    return Array.from(repos.values());
  }, [prs]);

  // Fetch collaborators from all repos using useState and useEffect
  const [allCollaborators, setAllCollaborators] = useState<Array<{ id: number; login: string; avatar_url: string }>>([]);

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const promises = uniqueRepos.map(async (repo) => {
          const response = await fetch(`/api/collaborators?owner=${repo.owner}&repo=${repo.repo}`);
          if (!response.ok) return [];
          return response.json();
        });

        const results = await Promise.all(promises);

        // Deduplicate by ID
        const collaboratorMap = new Map();
        results.flat().forEach((collaborator: any) => {
          collaboratorMap.set(collaborator.id, collaborator);
        });

        setAllCollaborators(Array.from(collaboratorMap.values()));
      } catch (error) {
        console.error('Error fetching collaborators:', error);
        setAllCollaborators([]);
      }
    };

    if (uniqueRepos.length > 0) {
      fetchCollaborators();
    }
  }, [uniqueRepos]);

  // Toggle filter selection
  const toggleFilter = (filter: FilterOption) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  // Select all filters
  const selectAllFilters = () => {
    setSelectedFilters(new Set<FilterOption>(['urgent', 'overdue', 'quick', 'unassigned']));
  };

  // Clear filter selection
  const clearFilterSelection = () => {
    setSelectedFilters(new Set());
  };

  // Toggle repository selection
  const toggleRepo = (repo: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) {
        next.delete(repo);
      } else {
        next.add(repo);
      }
      return next;
    });
  };

  // Select all repositories
  const selectAllRepos = () => {
    setSelectedRepos(new Set(repositories));
  };

  // Clear repository selection
  const clearRepoSelection = () => {
    setSelectedRepos(new Set());
  };

  // Filter PRs
  const filteredPRs = useMemo(() => {
    let filtered = prs;

    // Apply status filters (if any filters are selected)
    if (selectedFilters.size > 0) {
      filtered = filtered.filter((pr) => {
        if (selectedFilters.has('urgent') && pr.isUrgent) return true;
        if (selectedFilters.has('overdue') && pr.status === 'overdue') return true;
        if (selectedFilters.has('quick') && pr.isQuick) return true;
        if (selectedFilters.has('unassigned') && (pr.missingAssignee || pr.missingReviewer)) return true;
        return false;
      });
    }

    // Apply repository filter (if any repos are selected)
    if (selectedRepos.size > 0) {
      filtered = filtered.filter((pr) =>
        selectedRepos.has(`${pr.repo.owner}/${pr.repo.name}`)
      );
    }

    return filtered;
  }, [prs, selectedFilters, selectedRepos]);

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
      quick: prs.filter((pr) => pr.isQuick).length,
      missingAssignee: prs.filter((pr) => pr.missingAssignee).length,
      missingReviewer: prs.filter((pr) => pr.missingReviewer).length,
    };
  }, [prs]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total PRs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-red-300">
          <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
          <div className="text-sm text-red-600">Urgentes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-yellow-300">
          <div className="text-2xl font-bold text-yellow-600">{stats.quick}</div>
          <div className="text-sm text-yellow-500">Rápidas</div>
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
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
            <div className="relative" ref={filterDropdownRef}>
              <Button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                variant="default"
                size="sm"
              >
                <span>
                  {selectedFilters.size === 0
                    ? 'Todos'
                    : `${selectedFilters.size} filtro${selectedFilters.size > 1 ? 's' : ''}`}
                </span>
                <ChevronDown />
              </Button>

              {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[250px]">
                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <Button
                      onClick={selectedFilters.size === 0 ? selectAllFilters : clearFilterSelection}
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      {selectedFilters.size === 0 ? 'Seleccionar todos' : 'Limpiar selección'}
                    </Button>
                  </div>
                  <div className="p-2">
                    <label className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.has('urgent')}
                        onChange={() => toggleFilter('urgent')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm flex-1">
                        ⭐ Urgentes <span className="text-gray-500">({stats.urgent})</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.has('overdue')}
                        onChange={() => toggleFilter('overdue')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm flex-1">
                        🚨 Overdue <span className="text-gray-500">({stats.overdue})</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.has('quick')}
                        onChange={() => toggleFilter('quick')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm flex-1">
                        ⚡ Rápidas <span className="text-gray-500">({stats.quick})</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.has('unassigned')}
                        onChange={() => toggleFilter('unassigned')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm flex-1">
                        Sin asignar <span className="text-gray-500">({stats.unassigned})</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Repository filters */}
          {repositories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Repositorios:</span>
              <div className="relative" ref={repoDropdownRef}>
                <Button
                  onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
                  variant="secondary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <span>
                    {selectedRepos.size === 0
                      ? 'Todos'
                      : `${selectedRepos.size} repo${selectedRepos.size > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown />
                </Button>

                {isRepoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[300px] max-h-[400px] overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <Button
                        onClick={selectedRepos.size === 0 ? selectAllRepos : clearRepoSelection}
                        variant="secondary"
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {selectedRepos.size === 0 ? 'Seleccionar todos' : 'Limpiar selección'}
                      </Button>
                    </div>
                    <div className="p-2">
                      {repositories.map((repo) => {
                        const isSelected = selectedRepos.has(repo);
                        const repoCount = prs.filter(pr => `${pr.repo.owner}/${pr.repo.name}` === repo).length;
                        return (
                          <label
                            key={repo}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRepo(repo)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm flex-1">
                              {repo} <span className="text-gray-500">({repoCount})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 ml-auto"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Cargando...' : 'Refrescar'}</span>
          </Button>
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
              {selectedFilters.size === 0 && selectedRepos.size === 0
                ? 'No hay PRs abiertas'
                : 'No hay PRs que coincidan con los filtros seleccionados'}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando {sortedPRs.length} de {prs.length} PRs
            </div>
            {sortedPRs.map((pr) => (
              <PRCard
                key={`${pr.repo.owner}-${pr.repo.name}-${pr.number}`}
                pr={pr}
                onToggleUrgent={onToggleUrgent}
                onToggleQuick={onToggleQuick}
                isProcessingUrgent={isProcessingUrgent(pr)}
                isProcessingQuick={isProcessingQuick(pr)}
                collaborators={allCollaborators}
                onPRUpdated={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
