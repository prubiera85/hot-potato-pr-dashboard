# HotPotato PR Dashboard - Claude Context

**Versión**: 2.0.0 | Dashboard de PRs de GitHub con gestión visual tipo "patata caliente"

## Stack Tecnológico

- React + TypeScript + Vite, Tailwind CSS, Shadcn/ui (Radix UI)
- State: React Query (TanStack) + Zustand (Auth)
- Auth: GitHub OAuth + JWT (7 días)
- Backend: Netlify Functions (Serverless)
- Auto-refresh: 5 minutos

## Estructura Clave

```
src/
├── components/
│   ├── ui/               # Shadcn components
│   ├── app-sidebar.tsx   # Sidebar (sidebar-07 pattern)
│   ├── nav-user.tsx      # User dropdown
│   ├── Dashboard.tsx     # Vista principal
│   ├── MyPRsView.tsx     # PRs del usuario
│   ├── TeamAssignedView.tsx  # Carga de revisores
│   ├── TeamCreatedView.tsx   # PRs por creador
│   ├── PRCard.tsx        # Card individual
│   └── Auth*.tsx         # Login/Callback
├── stores/authStore.ts   # Zustand + localStorage
└── App.tsx               # Root + protected routes

netlify/functions/
├── auth-*.mts            # OAuth flow
└── auth/{jwt,middleware}.mts
```

## Sistema de Colores

**PRs (determinado SOLO por assignee):**
1. **Marrón** (`border-amber-700`): Con assignee (OK)
2. **Amarillo** (`border-yellow-400`): Sin assignee, <4h (warning)
3. **Rojo** (`border-red-400`): Sin assignee, >5 días (crítico)

**Tiempo abierta:**
- Verde: Dentro de límite
- Rojo animado (`animate-ring`): Excedió límite

**Stats Cards (filtros clickeables):**
- Activa: Color + 100% opacidad
- Inactiva: Gris (`bg-gray-100`) + 60% opacidad
- Total PRs (marrón), Urgentes (rojo), Rápidas (amarillo), Sin assignee/reviewer (naranjas)
- Tooltips instantáneos (`delayDuration={0}`)

## Autenticación GitHub OAuth

**Flujo:**
1. LoginScreen → `/api/auth-login` (GitHub OAuth URL)
2. GitHub callback → `/api/auth-callback` (código → token + user)
3. Whitelist check (opcional, actualmente abierta)
4. JWT (7 días) → localStorage via Zustand
5. Protected routes en App.tsx

**Variables de Entorno (Netlify):**
```bash
GITHUB_APP_CLIENT_ID=Iv23liMJt35aZuKXNpMX
GITHUB_APP_CLIENT_SECRET=9a88fa126de4e1f4a282a1da52b24bd60d7b3480
JWT_SECRET=super-secret-jwt-key-$(openssl rand -hex 16)
# ALLOWED_GITHUB_USERS=user1,user2  # Opcional, actualmente NO configurada
```

**Componentes:**
- `LoginScreen`: Botón "Sign in with GitHub"
- `AuthCallback`: Procesa callback, guarda token
- `authStore`: Zustand con `{user, token, isAuthenticated, login(), logout()}`
- `nav-user.tsx`: Dropdown con avatar, perfil, config, logout

**Funciones Serverless:**
- `auth-login.mts`: Genera GitHub OAuth URL
- `auth-callback.mts`: Intercambia código → token, valida whitelist, genera JWT
- `auth-me.mts`: Verifica sesión (`requireAuth` middleware)
- `auth/jwt.mts`: `generateToken()`, `verifyToken()`, `isUserAllowed()`

**Callbacks:**
- Prod: `https://hot-potato-pr-dashboard.netlify.app/auth/callback`
- Dev: `https://development--hot-potato-pr-dashboard.netlify.app/auth/callback`
- Local: `http://localhost:5173/auth/callback`

## Navegación

**Sidebar (Shadcn sidebar-07):**
- Colapsible (Ctrl/Cmd + B), variant "inset"
- Header: Logo patata (wiggle + GIF popup)
- Secciones: Pull Requests (Dashboard, Mis PRs) | Equipo (Revisores, PRs en Activo)
- Footer: Leyenda + NavUser

**Vistas:**
1. `all`: Dashboard principal con stats cards + filtros
2. `my-prs`: PRs creadas + asignadas al usuario (secciones plegables)
3. `team-assigned`: Carga de trabajo por revisor (tabla colapsable)
4. `team-created`: PRs activas por creador
5. `roles`: Gestión de usuarios/permisos (solo admins)

**Breadcrumbs dinámicos:**
- Pull Requests > Dashboard / Mis PRs
- Equipo > Revisores / PRs en Activo

## Componentes Principales

### Dashboard.tsx
- Stats cards clickeables como filtros (comportamiento exclusivo)
- Dropdown de filtros + repos (muestra TODOS los repos config)
- Auto-refresh cada 5 min
- Estado vacío: GIF matojo desierto
- Padding: `space-y-6 px-6`

### MyPRsView.tsx
**Secciones Collapsible:**
1. PRs Creadas por Mí: `pr.user.login === currentUser.login`
2. PRs Asignadas a Mí: `assignees` o `requested_reviewers` incluye currentUser

Ambas con contador, estado independiente, optimistic updates

### TeamAssignedView.tsx
- Query a `/api/get-user-roles` para usuarios registrados
- Muestra TODOS los usuarios, incluso con 0 PRs
- Tabla colapsable con PRs individuales
- **ID determinístico**: Suma charCodes del username (negativo) para usuarios sin PRs
- Ordenamiento: Por cantidad PRs (desc) → username (asc)

### TeamCreatedView.tsx
- Solo usuarios con PRs creadas
- Agrupa por `pr.user`
- Tabla colapsable con assignees/reviewers badges

### PRCard.tsx
**Layout:**
- Izquierda: Header (repo + urgent/quick) | Centro (título + info) | Footer (Ver en GitHub)
- Derecha: Sidebar asignaciones (256px fijo)
- Solo visible para developer/admin/superadmin

**Selectores (UserSelector):**
- Assignees: Incluye autor PR
- Reviewers: Excluye autor + assignees actuales
- Optimistic updates, sin refresh total
- Visible si `canManageAssignees`

**Info:**
- Comentarios con tooltip (generales + código, sin bots/Linear)

### App.tsx
**Optimistic Updates Patrón:**
1. **onMutate**: `cancelQueries` → snapshot → `setQueryData` optimista → return snapshot
2. **onSuccess**: NO `invalidateQueries` (mantiene update optimista)
3. **onError**: Restore snapshot

**Mutaciones:**
- `toggleUrgent/Quick`: Actualiza boolean + labels array
- `toggleAssignee/Reviewer`: Actualiza arrays + `missing*` flags
- **QueryKey**: `['prs', isTestMode]` SIEMPRE (crítico)

**Console logs (solo errores):**
- ❌ Errores críticos con detalles completos (input, expected, received, status HTTP, stack traces)
- ⚠️ Advertencias (duplicados, validaciones)
- Logs incluyen contexto completo para debugging
- NO se loguean operaciones exitosas (usar toasts para feedback visual)

## Características Clave

### Sistema de Filtros
**5 filtros (lógica OR inclusiva):**
1. Urgente (🔥 urgent label)
2. Rápida (⚡ quick label)
3. Asignación incompleta (assignee O reviewer)
4. Sin assignee
5. Sin reviewer

- Stats cards: Click = solo ese filtro | Total PRs = todos
- Checkboxes con `<label>` para accesibilidad
- Repos: Muestra todos los configurados (tengan PRs o no)

### Configuración
- `assignmentTimeLimit`: 4h (warning)
- `maxDaysOpen`: 5 días (crítico)
- Repos a monitorear
- Modo test (datos dummy)

## Convenciones CRÍTICAS

### Root Cause Analysis para Bugs (OBLIGATORIO)
1. Comparar comportamiento (local vs prod)
2. Revisar código que funciona (buscar patrones similares)
3. Analizar diferencias de entorno (build, timing, estado)
4. Identificar assumptions incorrectas
5. Buscar state inconsistencies (IDs no determinísticos, closures stale, deps incorrectas)
6. Validar con datos reales (nulls, undefined, edge cases)

**Ejemplo:** Collapsible no funciona en prod → Root cause: `Math.random()` en IDs → Solución: IDs determinísticos

### Shadcn/ui (OBLIGATORIO)
- **SIEMPRE** usar Shadcn/ui para UI
- **SIEMPRE** consultar MCP server antes de crear/modificar
- **NUNCA** crear componentes custom si existe en Shadcn
- Workflow: MCP → docs → `npx shadcn@latest add` → personalizar con Tailwind

**Disponibles:** Button, Card, Checkbox, Dialog, DropdownMenu, Input, Label, Select, Separator, Sheet, Tooltip, Avatar, Badge, Sidebar, Breadcrumb, Collapsible, Sonner

**Theme:** Yellow (primary: yellow-400, foreground: yellow-900)

**Notificaciones:**
- **SIEMPRE** usar Sonner (toasts) en lugar de `alert()` nativo
- `toast.error()` para errores críticos
- `toast.warning()` para advertencias
- `toast.success()` para confirmaciones exitosas
- Configurado en `App.tsx` con `<Toaster />`

### Nombres de Variables
- `pr/prs`: Pull Request(s)
- `hasAssignee/isOverMaxDays`: Booleans de estado
- `config`: Configuración

### Estilos
- Tailwind clases utilitarias
- Colores custom: `style={{ backgroundColor: '#ffeb9e' }}`
- Tooltips: `delayDuration={0}` SIEMPRE

## Integraciones GitHub API

**Netlify Functions:**
- `/api/collaborators`: Lista colaboradores (excluye bots)
- `/api/assign-assignees`: POST con `{owner, repo, pull_number, assignees[], action: 'add'|'remove'}`
- `/api/assign-reviewers`: POST similar (restricción: no autor PR)
- `/api/toggle-urgent|quick`: POST actualiza labels

**Lógica:**
- Reviewers: `requested_reviewers` + `pulls.listReviews()` combinados
- Comentarios: `issues.listComments()` + `pulls.listReviewComments()` filtrados (sin bots/Linear)
- Labels: `🔥 urgent` (d73a4a), `⚡ quick` (fbca04)

## Proceso de Desarrollo

**Workflow:**
1. Cambio de código
2. Actualizar CHANGELOG.md (`[Unreleased]`)
3. Actualizar CLAUDE.md (si afecta arquitectura/convenciones)
4. Commit (conventional: `feat:`, `fix:`, etc.) + Claude attribution footer
5. Push a `main` (deploy auto)

**Versionar:**
- Mover `[Unreleased]` → versión con fecha
- Actualizar `package.json` + CLAUDE.md
- Commit: `release: bump version to X.Y.Z`

## Notas Importantes

1. **Auth obligatoria**, actualmente acceso abierto (whitelist desactivada)
2. **Assignee = revisor principal** (determina colores)
3. **Filtros inclusivos** (OR): muestra PRs con ≥1 filtro activo
4. **Tooltips instantáneos** (`delayDuration={0}`)
5. **Stats cards clickeables** (comportamiento exclusivo)
6. **Optimistic updates**: NO `invalidateQueries` en `onSuccess` (crítico UX)
7. **QueryKey consistency**: `['prs', isTestMode]` siempre
8. **IDs determinísticos**: NUNCA `Math.random()` o `Date.now()` en keys/Collapsible
9. **Comentarios filtrados**: Excluye bots + Linear automáticamente
10. **Auto-refresh**: 5 min (no en test mode)
11. **Favicon**: `/potato-ico.ico`

## Animaciones

- `animate-ring`: Reloj rojo cuando excede límite
- `animate-wiggle`: Logo patata en hover

## Comandos

```bash
npm run dev        # Desarrollo local
npm run build      # Build producción
git push origin main  # Deploy auto a Netlify
```

## Próximas Mejoras

- [ ] Notificaciones push (PRs críticas)
- [ ] Métricas históricas por equipo
- [ ] Integración Slack
- [ ] Asignación automática de reviewers
