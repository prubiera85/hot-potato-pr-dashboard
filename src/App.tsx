import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Settings, BookOpen, Clock } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ConfigPanel } from './components/ConfigPanel';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [processingPRs, setProcessingPRs] = useState<Set<string>>(new Set());

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
    onSuccess: (_, pr) => {
      queryClient.invalidateQueries({ queryKey: ['prs'] });
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
    onSuccess: (_, pr) => {
      queryClient.invalidateQueries({ queryKey: ['prs'] });
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
  const config: DashboardConfig = {
    assignmentTimeLimit: configData?.assignmentTimeLimit || 4,
    maxDaysOpen: configData?.maxDaysOpen || 5,
    repositories: configData?.repositories || [],
  };

  const hasError = !isTestMode && prsData?.error;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="shadow" style={{ backgroundColor: '#ffeb9e' }}>
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/hot-potato-logo.png"
              alt="Hot Potato Logo"
              className="h-16 w-16 object-contain transition-transform duration-300 hover:animate-wiggle cursor-pointer"
              onClick={() => setIsGifModalOpen(true)}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                <span className="text-red-600">Hot</span>Potato PR Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                PRs sin asignar son como patatas calientes - pásalas rápido!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Help Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsHelpModalOpen(true)}
                    variant="secondary"
                    size="icon"
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    <BookOpen className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leyenda de colores</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Config Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsConfigOpen(true)}
                    variant="secondary"
                    size="icon"
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configuración</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            isLoading={isFetching && !isTestMode}
            onToggleUrgent={(pr) => toggleUrgentMutation.mutate(pr)}
            onToggleQuick={(pr) => toggleQuickMutation.mutate(pr)}
            onRefresh={() => refetch()}
            isProcessingUrgent={(pr) => processingPRs.has(`${getPRKey(pr)}-urgent`)}
            isProcessingQuick={(pr) => processingPRs.has(`${getPRKey(pr)}-quick`)}
            maxDaysOpen={config.maxDaysOpen}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
        <p>
          Hot Potato PR Dashboard v1.0
          {!isTestMode && ' • Actualización automática cada 5 minutos'}
        </p>
      </footer>

      {/* Config Modal */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={(newConfig) => saveConfigMutation.mutate(newConfig)}
        isSaving={saveConfigMutation.isPending}
        isTestMode={isTestMode}
        onTestModeChange={setIsTestMode}
      />

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
