import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { DashboardConfig, Repository } from '../types/github';
import { Modal } from './Modal';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onSave: (config: DashboardConfig) => void;
  isSaving: boolean;
}

export function ConfigPanel({ isOpen, onClose, config, onSave, isSaving }: ConfigPanelProps) {
  const [timeLimit, setTimeLimit] = useState(config.assignmentTimeLimit);
  const [repositories, setRepositories] = useState<Repository[]>(config.repositories);
  const [newRepoOwner, setNewRepoOwner] = useState('');
  const [newRepoName, setNewRepoName] = useState('');

  useEffect(() => {
    setTimeLimit(config.assignmentTimeLimit);
    setRepositories(config.repositories);
  }, [config]);

  const handleSave = () => {
    onSave({
      assignmentTimeLimit: timeLimit,
      warningThreshold: 80, // Fixed at 80%
      repositories,
    });
    onClose();
  };

  const handleAddRepo = () => {
    if (newRepoOwner && newRepoName) {
      const exists = repositories.some(
        (r) => r.owner === newRepoOwner && r.name === newRepoName
      );
      if (!exists) {
        setRepositories([
          ...repositories,
          { owner: newRepoOwner, name: newRepoName, enabled: true },
        ]);
        setNewRepoOwner('');
        setNewRepoName('');
      }
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
            ⏱️ Tiempo límite de asignación (SLA)
          </h3>
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
              PRs sin assignee o reviewer por más de {timeLimit} horas se marcarán como overdue 🚨
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Verás advertencia ⚠️ cuando llegue al 80% del tiempo ({Math.round(timeLimit * 0.8 * 10) / 10}h)
            </p>
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
                  placeholder="Owner (ej: facebook)"
                  value={newRepoOwner}
                  onChange={(e) => setNewRepoOwner(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Repo (ej: react)"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRepo}
                  disabled={!newRepoOwner || !newRepoName}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>
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
                    <button
                      onClick={() => handleRemoveRepo(index)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        {/* Save Button */}
        <div className="border-t pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || repositories.length === 0}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar configuración'}</span>
          </button>
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
