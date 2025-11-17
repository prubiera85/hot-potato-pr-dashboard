import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { DashboardConfig, Repository } from '../types/github';
import { Modal } from './Modal';
import { Button } from './ui/button';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onSave: (config: DashboardConfig) => void;
  isSaving: boolean;
}

export function ConfigPanel({ isOpen, onClose, config, onSave, isSaving }: ConfigPanelProps) {
  const [timeLimit, setTimeLimit] = useState(config.assignmentTimeLimit);
  const [maxDaysOpen, setMaxDaysOpen] = useState(config.maxDaysOpen || 5);
  const [repositories, setRepositories] = useState<Repository[]>(config.repositories);
  const [newRepoInput, setNewRepoInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setTimeLimit(config.assignmentTimeLimit);
    setMaxDaysOpen(config.maxDaysOpen || 5);
    setRepositories(config.repositories);
  }, [config]);

  const handleSave = () => {
    onSave({
      assignmentTimeLimit: timeLimit,
      maxDaysOpen: maxDaysOpen,
      repositories,
    });
    onClose();
  };

  // Extract owner/repo from URL or direct format
  const parseRepoInput = (input: string): { owner: string; name: string } | null => {
    const trimmed = input.trim();

    // Try to match GitHub URL patterns
    const urlPatterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/i,  // https://github.com/owner/repo or github.com/owner/repo
    ];

    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return {
          owner: match[1],
          name: match[2].replace(/\.git$/, ''), // Remove .git if present
        };
      }
    }

    // Try direct owner/repo format
    const directMatch = trimmed.match(/^([^\/]+)\/([^\/]+)$/);
    if (directMatch) {
      return {
        owner: directMatch[1],
        name: directMatch[2],
      };
    }

    return null;
  };

  const handleAddRepo = async () => {
    setValidationError(null);

    const parsed = parseRepoInput(newRepoInput);

    if (!parsed) {
      setValidationError(
        '❌ Formato inválido.\n\n' +
        '✅ Formatos aceptados:\n' +
        '  • URL completa: https://github.com/owner/repo\n' +
        '  • Formato corto: owner/repo\n\n' +
        'Ejemplos válidos:\n' +
        '  • https://github.com/facebook/react\n' +
        '  • facebook/react'
      );
      return;
    }

    // Check if already exists
    const exists = repositories.some(
      (r) => r.owner === parsed.owner && r.name === parsed.name
    );
    if (exists) {
      setValidationError(`⚠️ El repositorio ${parsed.owner}/${parsed.name} ya está en la lista`);
      return;
    }

    // Validate with backend
    setIsValidating(true);
    try {
      const response = await fetch('/api/validate-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.name,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setRepositories([
          ...repositories,
          { owner: parsed.owner, name: parsed.name, enabled: true },
        ]);
        setNewRepoInput('');
        setValidationError(null);
      } else {
        setValidationError(result.error || 'Error al validar el repositorio');
      }
    } catch (error) {
      setValidationError('⚠️ Error al validar el repositorio. Intenta de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleToggleRepo = (index: number) => {
    const updated = [...repositories];
    updated[index].enabled = !updated[index].enabled;
    setRepositories(updated);
  };

  const handleRemoveRepo = (index: number) => {
    setRepositories(repositories.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Configuración">
      <div className="space-y-6">
        {/* SLA Configuration */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            ⏱️ Configuración de tiempos
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo máximo sin assignee/reviewer (horas)
              </label>
              <input
                type="number"
                min="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ PRs sin assignee o reviewer por más de {timeLimit} horas se marcarán con borde <span className="text-yellow-600 font-bold">amarillo</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días máximos que una PR debería estar abierta
              </label>
              <input
                type="number"
                min="1"
                value={maxDaysOpen}
                onChange={(e) => setMaxDaysOpen(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                ⏱️ PRs abiertas por más de {maxDaysOpen} días se mostrarán en <span className="text-red-600 font-bold">rojo</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ✅ PRs abiertas por {maxDaysOpen} días o menos se mostrarán en <span className="text-green-600 font-bold">verde</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">📚 Repositorios</h3>

            {/* Add Repository */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar repositorio</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL o owner/repo (ej: https://github.com/facebook/react o facebook/react)"
                  value={newRepoInput}
                  onChange={(e) => {
                    setNewRepoInput(e.target.value);
                    setValidationError(null); // Clear error when typing
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !isValidating && handleAddRepo()}
                  className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    validationError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <Button
                  onClick={handleAddRepo}
                  disabled={!newRepoInput.trim() || isValidating}
                  variant="default"
                >
                  <Plus />
                  <span>{isValidating ? 'Validando...' : 'Agregar'}</span>
                </Button>
              </div>

              {/* Validation Error Message */}
              {validationError && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <pre className="text-sm text-red-800 whitespace-pre-wrap font-sans">
                        {validationError}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {!validationError && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Puedes pegar una URL de GitHub o escribir directamente owner/repo
                </p>
              )}
            </div>

            {/* Repository List */}
            <div className="space-y-2">
              {repositories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay repositorios configurados. Agrega uno para empezar.
                </p>
              ) : (
                repositories.map((repo, index) => (
                  <div
                    key={`${repo.owner}-${repo.name}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={repo.enabled}
                        onChange={() => handleToggleRepo(index)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono text-sm">
                        {repo.owner}/{repo.name}
                      </span>
                      {!repo.enabled && (
                        <span className="text-xs text-gray-500">(deshabilitado)</span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveRepo(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 />
                      <span>Eliminar</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={isSaving}
              variant="secondary"
              className="flex-1"
            >
              <XCircle />
              <span>Cancelar</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || repositories.length === 0}
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </Button>
          </div>
          {repositories.length === 0 && (
            <p className="text-xs text-red-600 mt-2 text-center">
              Debes agregar al menos un repositorio
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
