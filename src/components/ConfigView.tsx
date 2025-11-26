import { useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import type { DashboardConfig } from '../types/github';

interface ConfigViewProps {
  config: DashboardConfig;
  onSave: (config: DashboardConfig) => void;
  isSaving: boolean;
  isTestMode: boolean;
  onTestModeChange: (value: boolean) => void;
}

export function ConfigView({ config, onSave, isSaving, isTestMode, onTestModeChange }: ConfigViewProps) {
  const [editedConfig, setEditedConfig] = useState<DashboardConfig>(config);
  const [repoInput, setRepoInput] = useState('');

  const handleSave = () => {
    onSave(editedConfig);
  };

  const handleAddRepo = () => {
    if (!repoInput.trim()) return;

    const [owner, name] = repoInput.split('/');
    if (!owner || !name) {
      alert('Formato inválido. Usa: owner/repo');
      return;
    }

    const newRepo = { owner: owner.trim(), name: name.trim(), enabled: true };
    setEditedConfig({
      ...editedConfig,
      repositories: [...editedConfig.repositories, newRepo],
    });
    setRepoInput('');
  };

  const handleRemoveRepo = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      repositories: editedConfig.repositories.filter((_, i) => i !== index),
    });
  };

  const handleToggleRepo = (index: number) => {
    const updatedRepos = editedConfig.repositories.map((repo, i) =>
      i === index ? { ...repo, enabled: !repo.enabled } : repo
    );
    setEditedConfig({ ...editedConfig, repositories: updatedRepos });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-amber-700" />
          Configuración
        </h1>
        <p className="text-gray-600 mt-2">
          Configura los repositorios a monitorear y los límites de tiempo para las PRs.
        </p>
      </div>

      {/* Test Mode Warning */}
      {isTestMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Modo de prueba activo</p>
                <p>Estás usando datos de prueba. Los cambios no afectarán a los repositorios reales.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Límites de Tiempo</CardTitle>
          <CardDescription>
            Configura los límites de tiempo para detectar PRs que necesitan atención
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignmentTimeLimit">
              Límite de asignación (horas)
            </Label>
            <Input
              id="assignmentTimeLimit"
              type="number"
              min="1"
              value={editedConfig.assignmentTimeLimit}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  assignmentTimeLimit: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-gray-500">
              Tiempo máximo sin assignee antes de mostrar warning (amarillo)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDaysOpen">
              Días máximos abierta
            </Label>
            <Input
              id="maxDaysOpen"
              type="number"
              min="1"
              value={editedConfig.maxDaysOpen}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  maxDaysOpen: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-gray-500">
              Días máximos que una PR puede estar abierta antes de considerarse crítica (rojo)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Repositories */}
      <Card>
        <CardHeader>
          <CardTitle>Repositorios</CardTitle>
          <CardDescription>
            Gestiona los repositorios que quieres monitorear
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Repository */}
          <div className="flex gap-2">
            <Input
              placeholder="owner/repo"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
            />
            <Button onClick={handleAddRepo}>Agregar</Button>
          </div>

          {/* Repository List */}
          <div className="space-y-2">
            {editedConfig.repositories.map((repo, index) => (
              <div
                key={`${repo.owner}/${repo.name}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <Checkbox
                    checked={repo.enabled}
                    onCheckedChange={() => handleToggleRepo(index)}
                  />
                  <span className={repo.enabled ? 'text-gray-900' : 'text-gray-400'}>
                    {repo.owner}/{repo.name}
                  </span>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRepo(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            ))}

            {editedConfig.repositories.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay repositorios configurados. Agrega uno arriba.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Prueba</CardTitle>
          <CardDescription>
            Usa datos de prueba en lugar de datos reales de GitHub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={isTestMode}
              onCheckedChange={(checked) => onTestModeChange(checked as boolean)}
            />
            <span className="text-sm text-gray-700">
              Activar modo de prueba (usa datos dummy)
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
