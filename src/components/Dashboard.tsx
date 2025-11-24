import { useState, useMemo, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown, Loader2, GitPullRequest, Flame, Zap, AlertCircle, User, Eye } from 'lucide-react';
import type { EnhancedPR, SortOption, FilterOption } from '../types/github';
import { sortPRs } from '../utils/prHelpers';
import { PRCard } from './PRCard';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DashboardProps {
  prs: EnhancedPR[];
  isLoading: boolean;
  onToggleUrgent: (pr: EnhancedPR) => void;
  onToggleQuick: (pr: EnhancedPR) => void;
  onRefresh: () => void;
  isProcessingUrgent: (pr: EnhancedPR) => boolean;
  isProcessingQuick: (pr: EnhancedPR) => boolean;
  maxDaysOpen: number;
  configuredRepositories: Array<{ owner: string; name: string; enabled: boolean }>;
}

export function Dashboard({ prs, isLoading, onToggleUrgent, onToggleQuick, onRefresh, isProcessingUrgent, isProcessingQuick, maxDaysOpen, configuredRepositories }: DashboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>('time-open-asc');
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(new Set(['urgent', 'quick', 'unassigned', 'missing-assignee', 'missing-reviewer']));
  const [activeRepos, setActiveRepos] = useState<Set<string>>(new Set());
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

  // Get all configured repositories (enabled or not)
  const repositories = useMemo(() => {
    return configuredRepositories
      .map((repo) => `${repo.owner}/${repo.name}`)
      .sort();
  }, [configuredRepositories]);

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

  // Initialize active repos when repositories change
  useEffect(() => {
    setActiveRepos(new Set(repositories));
  }, [repositories]);

  // Toggle filter selection
  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  // Select/Deselect all filters
  const toggleAllFilters = () => {
    const allFilters: FilterOption[] = ['urgent', 'quick', 'unassigned', 'missing-assignee', 'missing-reviewer'];
    if (activeFilters.size === allFilters.length) {
      setActiveFilters(new Set());
    } else {
      setActiveFilters(new Set(allFilters));
    }
  };

  // Toggle repository selection
  const toggleRepo = (repo: string) => {
    setActiveRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) {
        next.delete(repo);
      } else {
        next.add(repo);
      }
      return next;
    });
  };

  // Select/Deselect all repositories
  const toggleAllRepos = () => {
    if (activeRepos.size === repositories.length) {
      setActiveRepos(new Set());
    } else {
      setActiveRepos(new Set(repositories));
    }
  };

  // Handle stat card clicks to filter PRs
  const handleStatClick = (filter: FilterOption | 'all') => {
    if (filter === 'all') {
      // Total PRs - select all filters
      const allFilters: FilterOption[] = ['urgent', 'quick', 'unassigned', 'missing-assignee', 'missing-reviewer'];
      setActiveFilters(new Set(allFilters));
    } else {
      // Select only this filter (exclusive)
      setActiveFilters(new Set([filter]));
    }
  };

  // Filter PRs
  const filteredPRs = useMemo(() => {
    let filtered = prs;

    // Apply status filters - show ONLY items that match ACTIVE filters
    if (activeFilters.size > 0 && activeFilters.size < 5) {
      filtered = filtered.filter((pr) => {
        if (activeFilters.has('urgent') && pr.isUrgent) return true;
        if (activeFilters.has('quick') && pr.isQuick) return true;
        if (activeFilters.has('unassigned') && (pr.missingAssignee || pr.missingReviewer)) return true;
        if (activeFilters.has('missing-assignee') && pr.missingAssignee) return true;
        if (activeFilters.has('missing-reviewer') && pr.missingReviewer) return true;
        return false;
      });
    } else if (activeFilters.size === 0) {
      // No filters active, show nothing
      filtered = [];
    }
    // If activeFilters.size === 5, show all (no filtering)

    // Apply repository filter - show ONLY repos that are ACTIVE
    if (activeRepos.size > 0 && activeRepos.size < repositories.length) {
      filtered = filtered.filter((pr) =>
        activeRepos.has(`${pr.repo.owner}/${pr.repo.name}`)
      );
    } else if (activeRepos.size === 0) {
      // No repos active, show nothing
      filtered = [];
    }
    // If activeRepos.size === repositories.length, show all (no filtering)

    return filtered;
  }, [prs, activeFilters, activeRepos, repositories.length]);

  // Sort PRs
  const sortedPRs = useMemo(() => {
    return sortPRs(filteredPRs, sortBy);
  }, [filteredPRs, sortBy]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: prs.length,
      urgent: prs.filter((pr) => pr.isUrgent).length,
      unassigned: prs.filter((pr) => pr.missingAssignee || pr.missingReviewer).length,
      quick: prs.filter((pr) => pr.isQuick).length,
      missingAssignee: prs.filter((pr) => pr.missingAssignee).length,
      missingReviewer: prs.filter((pr) => pr.missingReviewer).length,
    };
  }, [prs]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('all')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.size === 5
                    ? 'bg-amber-50 border-amber-700'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitPullRequest className={`w-5 h-5 ${activeFilters.size === 5 ? 'text-amber-800' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.size === 5 ? 'text-amber-900' : 'text-gray-600'}`}>{stats.total}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.size === 5 ? 'text-amber-800' : 'text-gray-500'}`}>Total PRs</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostrar todas las PRs (activa todos los filtros)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('urgent')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.has('urgent')
                    ? 'bg-red-50 border-red-500'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${activeFilters.has('urgent') ? 'text-red-600' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.has('urgent') ? 'text-red-700' : 'text-gray-600'}`}>{stats.urgent}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.has('urgent') ? 'text-red-600' : 'text-gray-500'}`}>Urgentes</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PRs marcadas con label 🔥 urgent</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('quick')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.has('quick')
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${activeFilters.has('quick') ? 'text-yellow-600' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.has('quick') ? 'text-yellow-700' : 'text-gray-600'}`}>{stats.quick}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.has('quick') ? 'text-yellow-700' : 'text-gray-500'}`}>Rápidas</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PRs marcadas con label ⚡ quick</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('missing-assignee')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.has('missing-assignee')
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className={`w-5 h-5 ${activeFilters.has('missing-assignee') ? 'text-orange-700' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.has('missing-assignee') ? 'text-orange-800' : 'text-gray-600'}`}>{stats.missingAssignee}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.has('missing-assignee') ? 'text-orange-700' : 'text-gray-500'}`}>Sin assignee</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PRs sin revisor principal asignado para aprobarlas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('missing-reviewer')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.has('missing-reviewer')
                    ? 'bg-orange-50 border-orange-400'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className={`w-5 h-5 ${activeFilters.has('missing-reviewer') ? 'text-orange-600' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.has('missing-reviewer') ? 'text-orange-700' : 'text-gray-600'}`}>{stats.missingReviewer}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.has('missing-reviewer') ? 'text-orange-600' : 'text-gray-500'}`}>Sin reviewer</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PRs que no tienen persona asignada para revisarlas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatClick('unassigned')}
                className={`rounded-lg shadow p-3 border-2 transition-all hover:scale-105 cursor-pointer text-left ${
                  activeFilters.has('unassigned')
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-5 h-5 ${activeFilters.has('unassigned') ? 'text-orange-500' : 'text-gray-500'}`} />
                  <div className={`text-xl font-bold ${activeFilters.has('unassigned') ? 'text-orange-600' : 'text-gray-600'}`}>{stats.unassigned}</div>
                </div>
                <div className={`text-xs mt-1 ${activeFilters.has('unassigned') ? 'text-orange-500' : 'text-gray-500'}`}>Asignación incompleta</div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>PRs sin assignee O sin reviewer (o ambos)</p>
            </TooltipContent>
          </Tooltip>
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
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                <span>
                  {activeFilters.size === 5
                    ? 'Todos'
                    : activeFilters.size === 0
                    ? 'Ninguno'
                    : `${activeFilters.size} filtro${activeFilters.size > 1 ? 's' : ''}`}
                </span>
                <ChevronDown />
              </Button>

              {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[250px]">
                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <Button
                      onClick={toggleAllFilters}
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-gray-50"
                    >
                      {activeFilters.size === 5 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  </div>
                  <div className="p-2">
                    <label
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has('urgent')}
                        onCheckedChange={() => toggleFilter('urgent')}
                      />
                      <span className="text-sm flex-1">
                        🔥 Urgentes <span className="text-gray-500">({stats.urgent})</span>
                      </span>
                    </label>
                    <label
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has('quick')}
                        onCheckedChange={() => toggleFilter('quick')}
                      />
                      <span className="text-sm flex-1">
                        ⚡ Rápidas <span className="text-gray-500">({stats.quick})</span>
                      </span>
                    </label>
                    <label
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has('unassigned')}
                        onCheckedChange={() => toggleFilter('unassigned')}
                      />
                      <span className="text-sm flex-1">
                        Asignación incompleta <span className="text-gray-500">({stats.unassigned})</span>
                      </span>
                    </label>
                    <label
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has('missing-assignee')}
                        onCheckedChange={() => toggleFilter('missing-assignee')}
                      />
                      <span className="text-sm flex-1">
                        Sin assignee <span className="text-gray-500">({stats.missingAssignee})</span>
                      </span>
                    </label>
                    <label
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has('missing-reviewer')}
                        onCheckedChange={() => toggleFilter('missing-reviewer')}
                      />
                      <span className="text-sm flex-1">
                        Sin reviewer <span className="text-gray-500">({stats.missingReviewer})</span>
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
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  <span>
                    {activeRepos.size === repositories.length
                      ? 'Todos'
                      : activeRepos.size === 0
                      ? 'Ninguno'
                      : `${activeRepos.size} repo${activeRepos.size > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown />
                </Button>

                {isRepoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[300px] max-h-[400px] overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <Button
                        onClick={toggleAllRepos}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white hover:bg-gray-50"
                      >
                        {activeRepos.size === repositories.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </Button>
                    </div>
                    <div className="p-2">
                      {repositories.map((repo) => {
                        const repoCount = prs.filter(pr => `${pr.repo.owner}/${pr.repo.name}` === repo).length;
                        return (
                          <label
                            key={repo}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <Checkbox
                              checked={activeRepos.has(repo)}
                              onCheckedChange={() => toggleRepo(repo)}
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
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[200px] h-8 text-xs font-medium bg-white hover:bg-gray-50">
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time-open-asc">Más nuevas primero</SelectItem>
                <SelectItem value="time-open-desc">Más antiguas primero</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cargando PRs...</span>
            </div>
          </div>
        ) : sortedPRs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="flex flex-col items-center gap-4">
              <img
                src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW5vMzdsNGxyMHF1M3RlNTY1Mjl0ZGM0dDh3NHZnN2E4djdyYXRnaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5x89XRx3sBZFC/giphy.gif"
                alt="Tumbleweed rolling in desert"
                className="w-80 h-auto rounded-lg"
              />
              <div className="text-gray-600 text-lg">
                {activeFilters.size === 5 && activeRepos.size === repositories.length
                  ? 'No hay PRs abiertas... 🌵'
                  : 'No hay PRs que coincidan con los filtros seleccionados'}
              </div>
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
                maxDaysOpen={maxDaysOpen}
                collaborators={allCollaborators}
                onPRUpdated={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}
