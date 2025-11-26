import { useMemo, useState, useEffect } from 'react';
import { RefreshCw, Inbox, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PRCard } from './PRCard';
import type { EnhancedPR } from '../types/github';

interface Collaborator {
  id: number;
  login: string;
  avatar_url: string;
}

interface MyPRsViewProps {
  prs: EnhancedPR[];
  currentUser: { login: string } | null;
  maxDaysOpen: number;
  onToggleUrgent: (pr: EnhancedPR) => void;
  onToggleQuick: (pr: EnhancedPR) => void;
  onToggleAssignee?: (pr: EnhancedPR, userId: number) => Promise<void>;
  onToggleReviewer?: (pr: EnhancedPR, userId: number) => Promise<void>;
  processingPRs: Set<string>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function MyPRsView({
  prs,
  currentUser,
  maxDaysOpen,
  onToggleUrgent,
  onToggleQuick,
  onToggleAssignee,
  onToggleReviewer,
  processingPRs,
  onRefresh,
  isRefreshing,
}: MyPRsViewProps) {
  // State for collapsible sections
  const [isCreatedOpen, setIsCreatedOpen] = useState(true);
  const [isAssignedOpen, setIsAssignedOpen] = useState(true);

  // Filter PRs created by me (where I'm the author)
  const myCreatedPRs = useMemo(() => {
    if (!currentUser) return [];
    return prs.filter((pr) => pr.user.login === currentUser.login);
  }, [prs, currentUser]);

  // Filter PRs where I'm assigned as assignee or reviewer (can include PRs I created if I'm also assigned)
  const myAssignedPRs = useMemo(() => {
    if (!currentUser) return [];
    return prs.filter((pr) => {
      // Check if I'm an assignee
      const isAssignee = pr.assignees.some((assignee) => assignee.login === currentUser.login);
      // Check if I'm a reviewer
      const isReviewer = pr.requested_reviewers.some((reviewer) => reviewer.login === currentUser.login);
      // Include if I'm assigned or reviewing
      return isAssignee || isReviewer;
    });
  }, [prs, currentUser]);

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

  // Fetch collaborators from all repos
  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([]);

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

  return (
    <div className="space-y-6 px-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-8 h-8 text-purple-600" />
            Mis PRs
          </h1>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>
        <p className="text-gray-600 mt-2">
          Gestiona las PRs que has creado y las que tienes asignadas
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: PRs created by me */}
        <Collapsible open={isCreatedOpen} onOpenChange={setIsCreatedOpen}>
          <div className="flex items-center justify-between mb-3">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              {isCreatedOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                PRs Creadas por Mí
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({myCreatedPRs.length})
                </span>
              </h3>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {myCreatedPRs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tienes PRs creadas
              </div>
            ) : (
              <div className="space-y-3">
              {myCreatedPRs.map((pr) => {
                const processingKey = `${pr.repo.owner}/${pr.repo.name}/${pr.number}`;
                const isProcessingUrgent = processingPRs.has(`urgent-${processingKey}`);
                const isProcessingQuick = processingPRs.has(`quick-${processingKey}`);
                const isProcessingAssignees = processingPRs.has(`assignees-${processingKey}`);
                const isProcessingReviewers = processingPRs.has(`reviewers-${processingKey}`);

                return (
                  <PRCard
                    key={pr.id}
                    pr={pr}
                    onToggleUrgent={onToggleUrgent}
                    onToggleQuick={onToggleQuick}
                    isProcessingUrgent={isProcessingUrgent}
                    isProcessingQuick={isProcessingQuick}
                    maxDaysOpen={maxDaysOpen}
                    collaborators={allCollaborators}
                    onToggleAssignee={onToggleAssignee ? async (pr, userId) => {
                      const user = allCollaborators.find(u => u.id === userId);
                      if (user) {
                        await onToggleAssignee(pr, userId);
                      }
                    } : undefined}
                    onToggleReviewer={onToggleReviewer ? async (pr, userId) => {
                      const user = allCollaborators.find(u => u.id === userId);
                      if (user) {
                        await onToggleReviewer(pr, userId);
                      }
                    } : undefined}
                    isProcessingAssignees={isProcessingAssignees}
                    isProcessingReviewers={isProcessingReviewers}
                  />
                );
              })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Section 2: PRs where I'm assigned */}
        <Collapsible open={isAssignedOpen} onOpenChange={setIsAssignedOpen}>
          <div className="flex items-center justify-between mb-3">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              {isAssignedOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                PRs Asignadas a Mí
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({myAssignedPRs.length})
                </span>
              </h3>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {myAssignedPRs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tienes PRs asignadas
              </div>
            ) : (
              <div className="space-y-3">
              {myAssignedPRs.map((pr) => {
                const processingKey = `${pr.repo.owner}/${pr.repo.name}/${pr.number}`;
                const isProcessingUrgent = processingPRs.has(`urgent-${processingKey}`);
                const isProcessingQuick = processingPRs.has(`quick-${processingKey}`);
                const isProcessingAssignees = processingPRs.has(`assignees-${processingKey}`);
                const isProcessingReviewers = processingPRs.has(`reviewers-${processingKey}`);

                return (
                  <PRCard
                    key={pr.id}
                    pr={pr}
                    onToggleUrgent={onToggleUrgent}
                    onToggleQuick={onToggleQuick}
                    isProcessingUrgent={isProcessingUrgent}
                    isProcessingQuick={isProcessingQuick}
                    maxDaysOpen={maxDaysOpen}
                    collaborators={allCollaborators}
                    onToggleAssignee={onToggleAssignee ? async (pr, userId) => {
                      const user = allCollaborators.find(u => u.id === userId);
                      if (user) {
                        await onToggleAssignee(pr, userId);
                      }
                    } : undefined}
                    onToggleReviewer={onToggleReviewer ? async (pr, userId) => {
                      const user = allCollaborators.find(u => u.id === userId);
                      if (user) {
                        await onToggleReviewer(pr, userId);
                      }
                    } : undefined}
                    isProcessingAssignees={isProcessingAssignees}
                    isProcessingReviewers={isProcessingReviewers}
                  />
                );
              })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
