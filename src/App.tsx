import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ConfigView } from './components/ConfigView';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallback } from './components/AuthCallback';
import { MyPRsView } from './components/MyPRsView';
import { TeamView } from './components/TeamView';
import { RoleManagementView } from './components/RoleManagementView';
import { GamificationView } from './components/GamificationView';
import { AppSidebar } from './components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
import type { DashboardConfig, EnhancedPR } from './types/github';
import { dummyPRs, dummyRepositories } from './utils/dummyData';
import { useAuthStore } from './stores/authStore';
import { verifySession } from './utils/auth';
import packageJson from '../package.json';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, token, user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<'all' | 'my-prs' | 'team' | 'config' | 'roles' | 'gamification'>('all');
  const [isTestMode, setIsTestMode] = useState(false);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [processingPRs, setProcessingPRs] = useState<Set<string>>(new Set());
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  // Show version in console on load
  useEffect(() => {
    console.log(
      `%c🥔 Hot Potato PR Dashboard v${packageJson.version} %c`,
      'background: #ffeb9e; color: #d97706; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 5px;',
      ''
    );
  }, []);

  // Verify session on mount
  useEffect(() => {
    const verify = async () => {
      if (token && !user) {
        // We have a token but no user, verify it
        const verifiedUser = await verifySession(token);
        if (!verifiedUser) {
          // Token is invalid, logout
          logout();
        }
      }
      setIsVerifyingSession(false);
    };
    verify();
  }, [token, user, logout]);

  // Fetch PRs and config
  const {
    data: prsData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['prs', isTestMode],
    queryFn: async () => {
      if (isTestMode) {
        // Return dummy data in test mode
        return { prs: dummyPRs, config: null };
      }
      const response = await fetch('/api/prs');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch PRs');
      }
      return response.json();
    },
    refetchInterval: isTestMode ? false : 300000, // Don't refresh in test mode (5 minutes)
  });

  // Fetch config
  const { data: configData } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      return response.json() as Promise<DashboardConfig>;
    },
    enabled: !isTestMode,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: DashboardConfig) => {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save config');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      queryClient.invalidateQueries({ queryKey: ['prs', isTestMode] });
    },
  });

  // Helper to get PR key
  const getPRKey = (pr: EnhancedPR) => `${pr.repo.owner}/${pr.repo.name}#${pr.number}`;

  // Toggle urgent mutation
  const toggleUrgentMutation = useMutation({
    mutationFn: async (pr: EnhancedPR) => {
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => new Set(prev).add(`${prKey}-urgent`));

      if (isTestMode) {
        // In test mode, just pretend it worked
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        return { success: true };
      }
      const response = await fetch('/api/toggle-urgent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          prNumber: pr.number,
          isUrgent: !pr.isUrgent,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle urgent');
      }
      return response.json();
    },
    onMutate: async (pr) => {
      console.log('🔄 [Urgent Mutation] onMutate called', { prId: pr.id, currentIsUrgent: pr.isUrgent });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prs', isTestMode] });

      // Snapshot the previous value
      const previousPRs = queryClient.getQueryData(['prs', isTestMode]);
      console.log('📸 [Urgent Mutation] Previous data snapshot taken');

      // Optimistically update to the new value
      queryClient.setQueryData(['prs', isTestMode], (old: any) => {
        if (!old) {
          console.log('❌ [Urgent Mutation] No old data found');
          return old;
        }

        const newIsUrgent = !pr.isUrgent;
        console.log('🎯 [Urgent Mutation] Toggling urgent:', pr.isUrgent, '->', newIsUrgent);

        const updated = {
          ...old,
          prs: old.prs.map((p: EnhancedPR) => {
            if (p.id === pr.id) {
              // Update labels array as well
              let newLabels = [...p.labels];
              const urgentLabelIndex = newLabels.findIndex(l => l.name.toLowerCase() === 'urgent');

              if (newIsUrgent && urgentLabelIndex === -1) {
                // Add urgent label
                newLabels.push({
                  id: Date.now(), // Temporary ID
                  name: 'urgent',
                  color: 'd73a4a'
                });
              } else if (!newIsUrgent && urgentLabelIndex !== -1) {
                // Remove urgent label
                newLabels = newLabels.filter(l => l.name.toLowerCase() !== 'urgent');
              }

              return {
                ...p,
                isUrgent: newIsUrgent,
                labels: newLabels,
              };
            }
            return p;
          }),
        };

        console.log('✅ [Urgent Mutation] Data updated optimistically');
        return updated;
      });

      return { previousPRs };
    },
    onSuccess: (_, pr) => {
      // No need to invalidate - optimistic update already handled it
      console.log('✅ [Urgent Mutation] Success - keeping optimistic update');
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-urgent`);
        return next;
      });
    },
    onError: (_, pr, context) => {
      // Rollback on error
      console.log('❌ [Urgent Mutation] Error - rolling back');
      if (context?.previousPRs) {
        queryClient.setQueryData(['prs', isTestMode], context.previousPRs);
      }
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-urgent`);
        return next;
      });
    },
  });

  // Toggle quick mutation
  const toggleQuickMutation = useMutation({
    mutationFn: async (pr: EnhancedPR) => {
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => new Set(prev).add(`${prKey}-quick`));

      if (isTestMode) {
        // In test mode, just pretend it worked
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        return { success: true };
      }
      const response = await fetch('/api/toggle-quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          prNumber: pr.number,
          isQuick: !pr.isQuick,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle quick');
      }
      return response.json();
    },
    onMutate: async (pr) => {
      console.log('🔄 [Quick Mutation] onMutate called', { prId: pr.id, currentIsQuick: pr.isQuick });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prs', isTestMode] });

      // Snapshot the previous value
      const previousPRs = queryClient.getQueryData(['prs', isTestMode]);
      console.log('📸 [Quick Mutation] Previous data snapshot taken');

      // Optimistically update to the new value
      queryClient.setQueryData(['prs', isTestMode], (old: any) => {
        if (!old) {
          console.log('❌ [Quick Mutation] No old data found');
          return old;
        }

        const newIsQuick = !pr.isQuick;
        console.log('🎯 [Quick Mutation] Toggling quick:', pr.isQuick, '->', newIsQuick);

        const updated = {
          ...old,
          prs: old.prs.map((p: EnhancedPR) => {
            if (p.id === pr.id) {
              // Update labels array as well
              let newLabels = [...p.labels];
              const quickLabelIndex = newLabels.findIndex(l => l.name.toLowerCase() === 'quick');

              if (newIsQuick && quickLabelIndex === -1) {
                // Add quick label
                newLabels.push({
                  id: Date.now(), // Temporary ID
                  name: 'quick',
                  color: 'fbca04'
                });
              } else if (!newIsQuick && quickLabelIndex !== -1) {
                // Remove quick label
                newLabels = newLabels.filter(l => l.name.toLowerCase() !== 'quick');
              }

              return {
                ...p,
                isQuick: newIsQuick,
                labels: newLabels,
              };
            }
            return p;
          }),
        };

        console.log('✅ [Quick Mutation] Data updated optimistically');
        return updated;
      });

      return { previousPRs };
    },
    onSuccess: (_, pr) => {
      // No need to invalidate - optimistic update already handled it
      console.log('✅ [Quick Mutation] Success - keeping optimistic update');
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-quick`);
        return next;
      });
    },
    onError: (_, pr, context) => {
      // Rollback on error
      console.log('❌ [Quick Mutation] Error - rolling back');
      if (context?.previousPRs) {
        queryClient.setQueryData(['prs', isTestMode], context.previousPRs);
      }
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-quick`);
        return next;
      });
    },
  });

  // Toggle assignee mutation
  const toggleAssigneeMutation = useMutation({
    mutationFn: async ({ pr, userId, userLogin }: { pr: EnhancedPR; userId: number; userLogin: string; avatarUrl: string }) => {
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => new Set(prev).add(`${prKey}-assignees`));

      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }

      // Determine if we're adding or removing
      const isCurrentlyAssigned = pr.assignees.some(a => a.id === userId);
      const action = isCurrentlyAssigned ? 'remove' : 'add';

      const response = await fetch('/api/assign-assignees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
          assignees: [userLogin],
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update assignees');
      }
      return response.json();
    },
    onMutate: async ({ pr, userId, userLogin, avatarUrl }) => {
      console.log('🔄 [Assignee Mutation] onMutate called', { prId: pr.id, userId, userLogin });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prs', isTestMode] });

      // Snapshot the previous value
      const previousPRs = queryClient.getQueryData(['prs', isTestMode]);
      console.log('📸 [Assignee Mutation] Previous data snapshot taken');

      // Optimistically update to the new value
      queryClient.setQueryData(['prs', isTestMode], (old: any) => {
        if (!old) {
          console.log('❌ [Assignee Mutation] No old data found');
          return old;
        }

        const isCurrentlyAssigned = pr.assignees.some(a => a.id === userId);
        console.log('🎯 [Assignee Mutation] isCurrentlyAssigned:', isCurrentlyAssigned);

        const updated = {
          ...old,
          prs: old.prs.map((p: EnhancedPR) => {
            if (p.id === pr.id) {
              let newAssignees;
              if (isCurrentlyAssigned) {
                // Remove assignee
                newAssignees = p.assignees.filter(a => a.id !== userId);
                console.log('➖ [Assignee Mutation] Removing assignee, new count:', newAssignees.length);
              } else {
                // Add assignee
                newAssignees = [...p.assignees, { id: userId, login: userLogin, avatar_url: avatarUrl, html_url: `https://github.com/${userLogin}` }];
                console.log('➕ [Assignee Mutation] Adding assignee, new count:', newAssignees.length);
              }

              return {
                ...p,
                assignees: newAssignees,
                missingAssignee: newAssignees.length === 0,
              };
            }
            return p;
          }),
        };

        console.log('✅ [Assignee Mutation] Data updated optimistically');
        return updated;
      });

      return { previousPRs };
    },
    onSuccess: (_, { pr }) => {
      // No need to invalidate - optimistic update already handled it
      console.log('✅ [Assignee Mutation] Success - keeping optimistic update');
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-assignees`);
        return next;
      });
    },
    onError: (_, { pr }, context) => {
      // Rollback on error
      console.log('❌ [Assignee Mutation] Error - rolling back');
      if (context?.previousPRs) {
        queryClient.setQueryData(['prs', isTestMode], context.previousPRs);
      }
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-assignees`);
        return next;
      });
    },
  });

  // Toggle reviewer mutation
  const toggleReviewerMutation = useMutation({
    mutationFn: async ({ pr, userId, userLogin }: { pr: EnhancedPR; userId: number; userLogin: string; avatarUrl: string }) => {
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => new Set(prev).add(`${prKey}-reviewers`));

      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }

      // Determine if we're adding or removing
      const isCurrentlyReviewer = pr.requested_reviewers.some(r => r.id === userId);
      const action = isCurrentlyReviewer ? 'remove' : 'add';

      const response = await fetch('/api/assign-reviewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
          reviewers: [userLogin],
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update reviewers');
      }
      return response.json();
    },
    onMutate: async ({ pr, userId, userLogin, avatarUrl }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prs', isTestMode] });

      // Snapshot the previous value
      const previousPRs = queryClient.getQueryData(['prs', isTestMode]);

      // Optimistically update to the new value
      queryClient.setQueryData(['prs', isTestMode], (old: any) => {
        if (!old) return old;

        const isCurrentlyReviewer = pr.requested_reviewers.some(r => r.id === userId);

        return {
          ...old,
          prs: old.prs.map((p: EnhancedPR) => {
            if (p.id === pr.id) {
              let newReviewers;
              if (isCurrentlyReviewer) {
                // Remove reviewer
                newReviewers = p.requested_reviewers.filter(r => r.id !== userId);
              } else {
                // Add reviewer
                newReviewers = [...p.requested_reviewers, { id: userId, login: userLogin, avatar_url: avatarUrl, html_url: `https://github.com/${userLogin}` }];
              }

              const reviewerCount = newReviewers.length + (p.requested_teams?.length || 0);

              return {
                ...p,
                requested_reviewers: newReviewers,
                reviewerCount,
                missingReviewer: reviewerCount === 0,
              };
            }
            return p;
          }),
        };
      });

      return { previousPRs };
    },
    onSuccess: (_, { pr }) => {
      // No need to invalidate - optimistic update already handled it
      console.log('✅ [Reviewer Mutation] Success - keeping optimistic update');
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-reviewers`);
        return next;
      });
    },
    onError: (_, { pr }, context) => {
      // Rollback on error
      console.log('❌ [Reviewer Mutation] Error - rolling back');
      if (context?.previousPRs) {
        queryClient.setQueryData(['prs', isTestMode], context.previousPRs);
      }
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-reviewers`);
        return next;
      });
    },
  });

  const prs: EnhancedPR[] = prsData?.prs || [];
  const config: DashboardConfig = {
    assignmentTimeLimit: configData?.assignmentTimeLimit || 4,
    maxDaysOpen: configData?.maxDaysOpen || 5,
    repositories: isTestMode ? dummyRepositories : (configData?.repositories || []),
  };

  const hasError = !isTestMode && prsData?.error;

  // Check if we're handling OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const isCallback = urlParams.has('code') || urlParams.has('error');

  // Show loading while verifying session
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 mx-auto mb-4">
            <svg viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Handle OAuth callback
  if (isCallback) {
    return <AuthCallback onSuccess={() => window.location.href = '/'} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as 'all' | 'my-prs' | 'team' | 'config' | 'roles')}
        onOpenGifModal={() => setIsGifModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-2" />
          <div className="flex items-center gap-2 flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer">
                    {(currentView === 'all' || currentView === 'my-prs') && 'Pull Requests'}
                    {currentView === 'team' && 'Equipo'}
                    {(currentView === 'config' || currentView === 'roles' || currentView === 'gamification') && 'Zona Admin'}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {currentView === 'all' && 'Todas las PRs'}
                    {currentView === 'my-prs' && 'Mis PRs'}
                    {currentView === 'team' && 'Vista por Usuario'}
                    {currentView === 'config' && 'Configuración'}
                    {currentView === 'roles' && 'Gestión de Roles'}
                    {currentView === 'gamification' && 'Gamificación'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
        {isTestMode && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 font-semibold">
              🧪 Modo Test Activo - Mostrando datos de ejemplo
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Desactiva el modo test para ver datos reales de GitHub
            </p>
          </div>
        )}

        {hasError ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Error al cargar las PRs</p>
            <p className="text-red-600 text-sm">{prsData.error}</p>
            {prsData.error.includes('GitHub App not configured') && (
              <div className="mt-4 text-left bg-white p-4 rounded">
                <p className="text-sm text-gray-700 mb-2">
                  Para usar este dashboard necesitas configurar una GitHub App:
                </p>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>Crea una GitHub App en tu cuenta de GitHub</li>
                  <li>Configura las variables de entorno en Netlify</li>
                  <li>Agrega repositorios en el panel de configuración</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Tip: Activa el "Modo Test" arriba para probar la interfaz con datos de
                    ejemplo
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {currentView === 'all' && (
              <Dashboard
                prs={prs}
                isLoading={isFetching && !isTestMode}
                onToggleUrgent={(pr) => toggleUrgentMutation.mutate(pr)}
                onToggleQuick={(pr) => toggleQuickMutation.mutate(pr)}
                onRefresh={() => refetch()}
                isProcessingUrgent={(pr) => processingPRs.has(`${getPRKey(pr)}-urgent`)}
                isProcessingQuick={(pr) => processingPRs.has(`${getPRKey(pr)}-quick`)}
                maxDaysOpen={config.maxDaysOpen}
                configuredRepositories={config.repositories}
                onToggleAssignee={async (pr, userId, userLogin, avatarUrl) => {
                  await toggleAssigneeMutation.mutateAsync({ pr, userId, userLogin, avatarUrl });
                }}
                onToggleReviewer={async (pr, userId, userLogin, avatarUrl) => {
                  await toggleReviewerMutation.mutateAsync({ pr, userId, userLogin, avatarUrl });
                }}
                isProcessingAssignees={(pr) => processingPRs.has(`${getPRKey(pr)}-assignees`)}
                isProcessingReviewers={(pr) => processingPRs.has(`${getPRKey(pr)}-reviewers`)}
              />
            )}
            {currentView === 'my-prs' && (
              <MyPRsView
                prs={prs}
                currentUser={user}
                maxDaysOpen={config.maxDaysOpen}
                onToggleUrgent={(pr) => toggleUrgentMutation.mutate(pr)}
                onToggleQuick={(pr) => toggleQuickMutation.mutate(pr)}
                onToggleAssignee={async (pr, userId) => {
                  const userToAssign = prs
                    .flatMap((p) => [...p.assignees, ...p.requested_reviewers, p.user])
                    .find((u) => u.id === userId);
                  if (userToAssign) {
                    await toggleAssigneeMutation.mutateAsync({
                      pr,
                      userId,
                      userLogin: userToAssign.login,
                      avatarUrl: userToAssign.avatar_url,
                    });
                  }
                }}
                onToggleReviewer={async (pr, userId) => {
                  const userToReview = prs
                    .flatMap((p) => [...p.assignees, ...p.requested_reviewers, p.user])
                    .find((u) => u.id === userId);
                  if (userToReview) {
                    await toggleReviewerMutation.mutateAsync({
                      pr,
                      userId,
                      userLogin: userToReview.login,
                      avatarUrl: userToReview.avatar_url,
                    });
                  }
                }}
                processingPRs={processingPRs}
                onRefresh={() => refetch()}
                isRefreshing={isFetching && !isTestMode}
              />
            )}
            {currentView === 'team' && <TeamView />}
            {currentView === 'config' && (
              <ConfigView
                config={config}
                onSave={(newConfig) => saveConfigMutation.mutate(newConfig)}
                isSaving={saveConfigMutation.isPending}
                isTestMode={isTestMode}
                onTestModeChange={setIsTestMode}
              />
            )}
            {currentView === 'roles' && <RoleManagementView />}
            {currentView === 'gamification' && <GamificationView />}
          </>
        )}

        <footer className="py-4 text-center text-sm text-gray-500 border-t">
          <p>
            Hot Potato PR Dashboard v{packageJson.version}
            {!isTestMode && ' • Actualización automática cada 5 minutos'}
          </p>
        </footer>
      </main>
      </SidebarInset>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Leyenda de Colores</h2>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* PR Card Colors Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Estados de las PRs</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-amber-700">
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900">Marrón Patata</div>
                      <div className="text-sm text-gray-600">PR con assignee asignado (estado normal)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-700">Amarillo</div>
                      <div className="text-sm text-gray-600">PR sin assignee pero dentro del límite de tiempo de {config.assignmentTimeLimit} horas (warning)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-red-400">
                    <div className="flex-1">
                      <div className="font-semibold text-red-700">Rojo</div>
                      <div className="text-sm text-gray-600">PR sin assignee Y pasado el límite de {config.maxDaysOpen} días abierta (crítico)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Indicator Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Indicador de Tiempo</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-600">Verde</div>
                      <div className="text-sm text-gray-600">La PR está dentro del límite de {config.maxDaysOpen} días permitidos</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-ring" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-600">Rojo</div>
                      <div className="text-sm text-gray-600">La PR ha excedido el límite de {config.maxDaysOpen} días permitidos</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> El estado de reviewer no afecta los colores del borde. Solo el assignee determina el esquema de colores principal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burning Potato GIF Modal */}
      {isGifModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsGifModalOpen(false)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/burning-potato.gif"
              alt="Burning Potato"
              className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setIsGifModalOpen(false)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
