# Arquitectura del PR Dashboard

## Descripción General

PR Dashboard es una aplicación web para monitorear Pull Requests de GitHub con un sistema de alertas SLA y gestión de asignaciones. Utiliza una arquitectura serverless con Netlify Functions y almacenamiento en Netlify Blobs.

## Stack Tecnológico

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**:
  - TanStack Query (React Query) para datos del servidor
  - Zustand para estado local (si aplica)
- **UI Components**:
  - shadcn/ui (Button, Avatar, Popover, Tooltip, Command, Tags)
  - Radix UI primitives
  - Lucide icons
  - Framer Motion para animaciones

### Backend
- **Serverless Functions**: Netlify Functions (Node.js 18+)
- **Storage**: Netlify Blobs (global scope)
- **Authentication**: GitHub App con Octokit
- **API**: REST endpoints via Netlify Functions

### Deployment
- **Hosting**: Netlify
- **CI/CD**: Automático en push a main
- **Build**: TypeScript + Vite

## Arquitectura de Componentes Frontend

### Componentes Principales

#### `App.tsx`
- Componente raíz
- Configura React Query client
- Renderiza Dashboard

#### `Dashboard.tsx`
- Componente principal del dashboard
- Gestiona el estado de filtros y ordenamiento
- Fetching de PRs con React Query
- Muestra métricas agregadas (total, urgentes, overdue, sin asignar)
- Renderiza lista de PRCards

#### `PRCard.tsx`
Componente de tarjeta individual de PR con las siguientes secciones:

**Estado Visual:**
- Borde verde: PR con assignee
- Borde rojo: PR sin assignee (overdue)
- Iconos de reloj según tiempo transcurrido

**Información Mostrada:**
- Título y número de PR
- Repositorio
- Tiempo abierta
- Autor
- Número de comentarios
- Labels de GitHub
- Estado de urgente/rápida

**Sección de Asignación (Sidebar derecho):**
- **Assignees**: Muestra avatares de usuarios asignados
- **Reviewers**: Muestra avatares de revisores solicitados
- Indicadores "Sin asignar" / "Sin reviewers" cuando corresponde

**Acciones:**
- Botón "Urgente" (variante destructive/outline)
- Botón "Rápida" (variante default/outline con color amarillo)
- Enlace "Ver en GitHub" (variante link, color azul)

### Sistema de Asignación de Usuarios (Comentado actualmente)

El sistema de asignación permite agregar/remover assignees y reviewers desde la UI. Aunque el código está comentado, la funcionalidad existe:

#### Componente `UserSelector`
Ubicación: `src/components/ui/user-selector.tsx`

**Características:**
- Dropdown multi-select basado en shadcn/ui Tags component
- Búsqueda de usuarios en tiempo real
- Muestra avatares y usernames
- Indicador visual de selección (Check icon)
- Contador de usuarios seleccionados

**Props:**
```typescript
interface UserSelectorProps {
  availableUsers: User[];      // Lista de usuarios disponibles
  selectedUserIds: number[];    // IDs de usuarios ya seleccionados
  onToggleUser: (userId: number) => void; // Callback para agregar/remover
  className?: string;
  placeholder?: string;
}
```

#### Lógica de Asignación en PRCard

**handleToggleAssignee:**
```typescript
const handleToggleAssignee = async (userId: number) => {
  // 1. Encuentra el usuario en la lista
  const user = availableUsers.find(u => u.id === userId);

  // 2. Determina si agregar o remover
  const isCurrentlyAssigned = pr.assignees.some(a => a.id === userId);
  const action = isCurrentlyAssigned ? 'remove' : 'add';

  // 3. Llama al endpoint /api/assign-assignees
  const response = await fetch('/api/assign-assignees', {
    method: 'POST',
    body: JSON.stringify({
      owner: pr.repo.owner,
      repo: pr.repo.name,
      pull_number: pr.number,
      assignees: [user.login],
      action,
    }),
  });

  // 4. Actualiza el estado local optimísticamente
  setPr(prevPR => ({
    ...prevPR,
    assignees: isCurrentlyAssigned
      ? prevPR.assignees.filter(a => a.id !== userId)
      : [...prevPR.assignees, user],
    missingAssignee: newAssignees.length === 0,
  }));
};
```

**handleToggleReviewer:**
Similar a `handleToggleAssignee` pero para reviewers:
- Llama a `/api/assign-reviewers`
- Actualiza `requested_reviewers` en lugar de `assignees`
- Filtra el autor del PR (GitHub no permite que el autor sea reviewer)

**Estado de Carga:**
```typescript
const [isAssigningAssignees, setIsAssigningAssignees] = useState(false);
const [isAssigningReviewers, setIsAssigningReviewers] = useState(false);
```

**Filtrado de Usuarios:**
```typescript
// Lista completa de colaboradores
const availableUsers = collaborators;

// Excluye el autor del PR de la lista de reviewers
const availableReviewers = availableUsers.filter(
  user => user.id !== pr.user.id
);
```

**UI Comentada (ejemplo):**
```tsx
{/* En el sidebar de la PRCard */}
<div>
  {isAssigningAssignees ? (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Actualizando...</span>
    </div>
  ) : (
    <UserSelector
      availableUsers={availableUsers}
      selectedUserIds={pr.assignees.map(a => a.id)}
      onToggleUser={handleToggleAssignee}
    />
  )}
</div>
```

### Hook: `useCollaborators`
Ubicación: `src/hooks/useCollaborators.ts`

**Propósito:** Obtener lista de colaboradores para un repositorio

**Uso:**
```typescript
const { data: collaborators, isLoading } = useCollaborators(owner, repo);
```

## Arquitectura Backend (Netlify Functions)

### Endpoints API

Todas las funciones están en `netlify/functions/` y son accesibles via `/api/*`.

#### 1. `get-prs.mts`
**Endpoint:** `GET /api/prs`

**Funcionalidad:**
- Obtiene PRs abiertas de todos los repositorios configurados
- Agrupa peticiones por owner para optimización
- Calcula metadata: estado, tiempo abierto, flags urgente/rápida
- Lee configuración desde Netlify Blobs

**Respuesta:**
```typescript
{
  prs: EnhancedPR[],
  config: Config,
  errors?: Record<string, string>
}
```

#### 2. `assign-assignees.mts`
**Endpoint:** `POST /api/assign-assignees`

**Body:**
```typescript
{
  owner: string,
  repo: string,
  pull_number: number,
  assignees: string[],  // array de logins
  action: 'add' | 'remove'
}
```

**Funcionalidad:**
- Agrega o remueve assignees de una PR
- Usa GitHub API: `octokit.rest.issues.addAssignees()` / `removeAssignees()`
- Retorna la PR actualizada

**Implementación:**
```typescript
if (action === 'add') {
  await octokit.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: pull_number,
    assignees,
  });
} else {
  await octokit.rest.issues.removeAssignees({
    owner,
    repo,
    issue_number: pull_number,
    assignees,
  });
}
```

#### 3. `assign-reviewers.mts`
**Endpoint:** `POST /api/assign-reviewers`

**Body:**
```typescript
{
  owner: string,
  repo: string,
  pull_number: number,
  reviewers: string[],  // array de logins
  action: 'add' | 'remove'
}
```

**Funcionalidad:**
- Agrega o remueve reviewers de una PR
- Usa GitHub API: `octokit.rest.pulls.requestReviewers()` / `removeRequestedReviewers()`
- Valida que el reviewer no sea el autor del PR

**Implementación:**
```typescript
if (action === 'add') {
  await octokit.rest.pulls.requestReviewers({
    owner,
    repo,
    pull_number,
    reviewers,
  });
} else {
  await octokit.rest.pulls.removeRequestedReviewers({
    owner,
    repo,
    pull_number,
    reviewers,
  });
}
```

#### 4. `get-collaborators.mts`
**Endpoint:** `GET /api/collaborators?owner=X&repo=Y`

**Funcionalidad:**
- Obtiene lista de colaboradores de un repositorio
- Intenta múltiples fuentes en orden:
  1. `octokit.rest.repos.listCollaborators()` (colaboradores directos)
  2. `octokit.rest.repos.listContributors()` (contribuidores)
  3. `octokit.rest.orgs.listMembers()` (miembros de la organización)
- Elimina duplicados por ID
- Excluye usuarios específicos (ej: bots)

**Respuesta:**
```typescript
{
  collaborators: Array<{
    id: number,
    login: string,
    avatar_url: string
  }>
}
```

**Implementación:**
```typescript
let users = [];

// Intenta obtener colaboradores
try {
  const { data } = await octokit.rest.repos.listCollaborators({
    owner,
    repo,
    per_page: 100,
  });
  users = data;
} catch (error) {
  // Si falla, intenta contributors
  try {
    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100,
    });
    users = data;
  } catch (error) {
    // Si falla, intenta miembros de la org
    const { data } = await octokit.rest.orgs.listMembers({
      org: owner,
      per_page: 100,
    });
    users = data;
  }
}

// Filtra y deduplica
const uniqueUsers = Array.from(
  new Map(users.map(u => [u.id, u])).values()
).filter(u => !excludedUsers.includes(u.login));
```

#### 5. `toggle-urgent.mts`
**Endpoint:** `POST /api/toggle-urgent`

**Funcionalidad:**
- Agrega/remueve el label "urgent" de una PR
- Crea el label si no existe

#### 6. `toggle-quick.mts`
**Endpoint:** `POST /api/toggle-quick`

**Funcionalidad:**
- Agrega/remueve el label "quick" de una PR
- Crea el label si no existe

#### 7. `validate-repo.mts`
**Endpoint:** `POST /api/validate-repo`

**Funcionalidad:**
- Valida que la GitHub App tenga acceso al repositorio
- Verifica permisos necesarios

#### 8. `config.mts`
**Endpoint:** `GET/POST /api/config`

**Funcionalidad:**
- GET: Obtiene configuración desde Netlify Blobs
- POST: Guarda configuración en Netlify Blobs

**Configuración:**
```typescript
interface Config {
  assignmentTimeLimit: number;  // Horas para SLA
  warningThreshold: number;     // % del tiempo para warning
  repositories: Array<{
    owner: string;
    name: string;
    enabled: boolean;
  }>;
}
```

### Autenticación GitHub

**Archivo:** `netlify/functions/lib/github-auth.mts`

**Funcionalidad:**
- Gestiona autenticación con GitHub App
- Soporta múltiples instalaciones
- Cachea tokens de autenticación

**Función principal:**
```typescript
export async function getInstallationOctokit(owner: string): Promise<Octokit> {
  // 1. Obtiene lista de instalaciones
  const installations = await getInstallations();

  // 2. Encuentra instalación para el owner
  const installation = installations.find(
    inst => inst.account?.login.toLowerCase() === owner.toLowerCase()
  );

  // 3. Crea Octokit autenticado para esa instalación
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Netlify.env.get('GITHUB_APP_ID'),
      privateKey: Netlify.env.get('GITHUB_APP_PRIVATE_KEY'),
      installationId: installation.id,
    },
  });
}
```

## Sistema de Almacenamiento (Netlify Blobs)

### Store: `pr-dashboard-config`

**Scope:** Global (persiste entre deploys)

**Consistencia:** Eventual (por defecto)

**Keys:**
- `config`: Objeto con configuración del dashboard

**Uso:**
```typescript
import { getStore } from "@netlify/blobs";

// Leer
const configStore = getStore("pr-dashboard-config");
const config = await configStore.get("config", { type: "json" });

// Escribir
await configStore.setJSON("config", {
  assignmentTimeLimit: 4,
  warningThreshold: 80,
  repositories: [...]
});
```

**Almacenamiento Local:**
- En desarrollo (`netlify dev`), los blobs se almacenan en `.netlify/blobs-serve`
- Modo sandbox automático

## Flujo de Datos

### 1. Carga Inicial de PRs

```
Usuario accede → Dashboard.tsx
  ↓
useQuery('/api/prs')
  ↓
get-prs.mts:
  - Lee config de Blobs
  - Agrupa repos por owner
  - Para cada owner:
    - getInstallationOctokit(owner)
    - octokit.rest.pulls.list()
  - Calcula metadata (status, flags)
  ↓
Retorna { prs, config, errors }
  ↓
Dashboard renderiza PRCards
```

### 2. Asignación de Assignee (Funcionalidad comentada)

```
Usuario abre UserSelector → Busca usuario → Click en usuario
  ↓
handleToggleAssignee(userId)
  ↓
POST /api/assign-assignees
  - action: 'add' o 'remove'
  - assignees: [login]
  ↓
assign-assignees.mts:
  - getInstallationOctokit(owner)
  - octokit.rest.issues.addAssignees() / removeAssignees()
  ↓
Retorna PR actualizada
  ↓
setPr() actualiza estado local
  ↓
PRCard re-renderiza con nuevos assignees
```

### 3. Toggle Label (Urgente/Rápida)

```
Usuario click botón "Urgente"
  ↓
onToggleUrgent(pr)
  ↓
POST /api/toggle-urgent
  - owner, repo, pull_number
  - isUrgent: boolean
  ↓
toggle-urgent.mts:
  - getInstallationOctokit(owner)
  - Si agregar: octokit.rest.issues.addLabels()
  - Si remover: octokit.rest.issues.removeLabel()
  ↓
Retorna success
  ↓
Dashboard refetch de PRs
  ↓
PRCard muestra nuevo estado
```

## Tipos TypeScript

### Tipos Principales

```typescript
// src/types/github.ts

interface EnhancedPR {
  // Datos básicos de GitHub
  id: number;
  number: number;
  title: string;
  html_url: string;
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
  created_at: string;

  // Asignaciones
  assignees: Array<{
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
  }>;
  requested_reviewers: Array<{
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
  }>;

  // Labels
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;

  // Metadata calculada
  status: 'ok' | 'warning' | 'overdue';
  hoursOpen: number;
  missingAssignee: boolean;
  missingReviewer: boolean;
  reviewerCount: number;
  commentCount: number;
  isUrgent: boolean;
  isQuick: boolean;

  // Repo info
  repo: {
    owner: string;
    name: string;
  };
}

interface Collaborator {
  id: number;
  login: string;
  avatar_url: string;
}
```

## Variables de Entorno

### Desarrollo Local (.env)
```
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=78910
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
```

### Producción (Netlify)
Configuradas en Netlify UI:
- `GITHUB_APP_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`

## Configuración de Build

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### package.json scripts
```json
{
  "dev": "vite",
  "start": "netlify dev",
  "build": "tsc && vite build",
  "deploy": "npm run build && netlify deploy --prod"
}
```

## Optimizaciones

### 1. Agrupación de Peticiones por Owner
En lugar de crear un Octokit por repositorio, se agrupa por owner para reutilizar la misma instancia autenticada.

### 2. Update Optimista en UI
Cuando se asignan usuarios, el estado local se actualiza inmediatamente sin esperar refetch completo.

### 3. React Query Cache
Las PRs se cachean en React Query con `staleTime` configurado para reducir peticiones.

### 4. Lazy Loading de Colaboradores
Los colaboradores solo se cargan cuando se abre el UserSelector (si se descomenta).

## Limitaciones Conocidas

1. **Función de Asignación Comentada**: El código para asignar assignees/reviewers existe pero está comentado en la UI actual.

2. **Filtro de Autor**: GitHub no permite que el autor del PR sea reviewer, esto se maneja filtrando en el frontend.

3. **Rate Limiting**: GitHub API tiene límites de rate. No hay manejo específico actualmente.

4. **Permisos**: La GitHub App requiere permisos de read/write en:
   - Pull requests
   - Issues (para assignees)
   - Repository contents (para colaboradores)

## Futuras Mejoras Sugeridas

1. **Re-habilitar Asignación en UI**: Descomentar y mejorar el UserSelector en PRCard
2. **Notificaciones**: Push notifications cuando una PR se vuelve overdue
3. **Webhooks**: Usar webhooks de GitHub en lugar de polling
4. **Filtros Avanzados**: Por autor, por fecha, por repositorio específico
5. **Estadísticas**: Dashboard con métricas históricas
6. **Modo Offline**: Service worker para funcionar sin conexión
7. **Tests**: Agregar tests unitarios y de integración
