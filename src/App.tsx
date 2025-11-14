import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Dashboard } from './components/Dashboard';
import { ConfigPanel } from './components/ConfigPanel';
import type { DashboardConfig, EnhancedPR } from './types/github';
import { dummyPRs } from './utils/dummyData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [processingPRs, setProcessingPRs] = useState<Set<string>>(new Set());

  // Fetch PRs and config
  const {
    data: prsData,
    isLoading,
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
    refetchInterval: isTestMode ? false : 60000, // Don't refresh in test mode
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
      queryClient.invalidateQueries({ queryKey: ['prs'] });
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
    onSuccess: async (_, pr) => {
      // Wait for the query to refetch before clearing processing state
      await queryClient.invalidateQueries({ queryKey: ['prs'] });
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-urgent`);
        return next;
      });
    },
    onError: (_, pr) => {
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
    onSuccess: async (_, pr) => {
      // Wait for the query to refetch before clearing processing state
      await queryClient.invalidateQueries({ queryKey: ['prs'] });
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-quick`);
        return next;
      });
    },
    onError: (_, pr) => {
      const prKey = getPRKey(pr);
      setProcessingPRs(prev => {
        const next = new Set(prev);
        next.delete(`${prKey}-quick`);
        return next;
      });
    },
  });

  const prs: EnhancedPR[] = prsData?.prs || [];
  const config: DashboardConfig = configData || {
    assignmentTimeLimit: 4,
    warningThreshold: 80,
    repositories: [],
  };

  const hasError = !isTestMode && prsData?.error;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/hot-potato-logo.png"
              alt="Hot Potato Logo"
              className="h-16 w-16 object-contain transition-transform duration-300 hover:animate-wiggle cursor-pointer"
              onClick={() => setIsGifModalOpen(true)}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hot Potato PR Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                PRs sin asignar son como patatas calientes - pásalas rápido!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Test Mode Toggle */}
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Ver mockup
                </span>
              </label>
            </div>
            {/* Config Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Configuración</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
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
          <Dashboard
            prs={prs}
            isLoading={isLoading && !isTestMode}
            onToggleUrgent={(pr) => toggleUrgentMutation.mutate(pr)}
            onToggleQuick={(pr) => toggleQuickMutation.mutate(pr)}
            onRefresh={() => refetch()}
            isProcessingUrgent={(pr) => processingPRs.has(`${getPRKey(pr)}-urgent`)}
            isProcessingQuick={(pr) => processingPRs.has(`${getPRKey(pr)}-quick`)}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
        <p>
          Hot Potato PR Dashboard v1.0
          {!isTestMode && ' • Actualización automática cada minuto'}
        </p>
      </footer>

      {/* Config Modal */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={(newConfig) => saveConfigMutation.mutate(newConfig)}
        isSaving={saveConfigMutation.isPending}
      />

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
    </div>
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
