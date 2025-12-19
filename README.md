# HotPotato PR Dashboard

Dashboard de Pull Requests de GitHub con gestión visual tipo "patata caliente" - ¡Nadie quiere quedarse con una PR sin revisar!

## Características

### 🎯 Gestión de PRs
- 📊 **Dashboard en tiempo real**: Visualiza todas las PRs abiertas de múltiples repositorios
- ⏱️ **Sistema de colores inteligente**: Estados basados en asignación (Marrón=OK, Amarillo=Warning <4h, Rojo=Crítico >5 días)
- 🚨 **Alertas visuales**: Indicadores de tiempo excedido con animaciones
- ⭐ **Marcado de urgentes y rápidas**: Marca PRs con labels de GitHub (🔥 urgent, ⚡ quick)
- 🔍 **Filtros avanzados**: 5 filtros inclusivos (urgente, rápida, asignación incompleta, sin assignee, sin reviewer)
- 📊 **Stats cards clickeables**: Métricas que funcionan como filtros rápidos con comportamiento exclusivo
- 👥 **Gestión completa de asignaciones**: Selección de assignees y reviewers con optimistic updates
- 🤖 **Exclusión automática de bots**: Filtra bots de assignees, reviewers y comentarios
- 💬 **Desglose de comentarios**: Muestra comentarios generales y de código (sin bots/Linear)
- 🔄 **Auto-refresh**: Actualización automática cada 5 minutos

### 🗂️ Vistas Especializadas
- **Dashboard**: Vista principal con stats cards y filtros
- **Mis PRs**: Dos secciones plegables (PRs creadas por mí / PRs asignadas a mí)
- **Revisores**: Carga de trabajo por revisor con tabla colapsable
- **PRs en Activo**: PRs activas agrupadas por creador

### 🔐 Autenticación y Roles
- **GitHub OAuth**: Login obligatorio con GitHub
- **Sistema de roles**: 4 niveles (superadmin, admin, developer, guest)
  - **Superadmin**: Acceso completo + gestión de roles
  - **Admin**: Configuración de repos + permisos de developer
  - **Developer**: Ver y editar PRs (urgente/rápida, assignees/reviewers)
  - **Guest**: Solo visualización
- **Whitelist opcional**: Control de acceso por usuarios específicos
- **JWT con 7 días de expiración**: Sesión persistente

### 🎨 UI/UX
- **Sidebar colapsable**: Navegación estilo Shadcn sidebar-07 (Ctrl/Cmd + B)
- **Breadcrumbs dinámicos**: Navegación contextual en el header
- **Theme personalizado**: Color primario amarillo con Shadcn/ui
- **Notificaciones Sonner**: Toasts en lugar de alerts nativos
- **Badges de entorno**: Indicadores visuales en development (ribbon diagonal + footer)
- **Responsive**: Diseño adaptativo con drawer móvil

### ⚙️ Configuración Flexible
- Panel de configuración (solo admin/superadmin)
- Gestión de repositorios (agregar, eliminar, habilitar/deshabilitar)
- Configuración de límites de tiempo (asignación y máximo días abierto)
- Gestión de roles de usuario

## Stack Tecnológico

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI)
- **State Management**:
  - TanStack Query (React Query) para datos remotos
  - Zustand para autenticación
- **Backend**: Netlify Functions (Serverless)
- **Storage**: Netlify Blobs
- **Auth**: GitHub OAuth + JWT
- **GitHub Integration**: GitHub App con Octokit

## Instalación y Desarrollo Local

1. Clona el repositorio:
```bash
git clone https://github.com/prubiera85/hot-potato-pr-dashboard.git
cd hot-potato-pr-dashboard
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno (ver [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md)):
```bash
cp .env.example .env
# Edita .env con tus credenciales (ver sección Variables de Entorno)
```

4. Inicia el servidor de desarrollo con todas las funcionalidades de Netlify:
```bash
npm start
```

Esto iniciará:
- ✅ Servidor de desarrollo en **http://localhost:8888**
- ✅ Todas las Netlify Functions activas
- ✅ Netlify Blobs en modo sandbox local
- ✅ Variables de entorno cargadas
- ✅ Hot reload automático

## Deploy en Netlify

### Configuración Inicial

1. Conecta el repositorio a Netlify
2. Configura las variables de entorno (ver sección Variables de Entorno)
3. Deploy automático en cada push a main

### Variables de Entorno Requeridas

#### GitHub App (para acceso a PRs)
```bash
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=789012
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
..."  # Private key completa (.pem)
```

#### GitHub OAuth (para autenticación de usuarios)
```bash
GITHUB_APP_CLIENT_ID=Iv23liMJt35aZuKXNpMX
GITHUB_APP_CLIENT_SECRET=9a88fa126de4e1f4a282a1da52b24bd60d7b3480
JWT_SECRET=super-secret-jwt-key-$(openssl rand -hex 16)
```

#### Configuración Opcional
```bash
# Whitelist de usuarios permitidos (separados por coma)
# Si no se configura, acceso abierto a cualquier usuario de GitHub
ALLOWED_GITHUB_USERS=user1,user2,user3

# Roles de usuarios (formato: username:role)
# Roles: superadmin, admin, developer, guest
# Si no se configura, todos son 'guest' por defecto
USER_ROLES=prubiera85:superadmin,john:admin,jane:developer
```

### Configuración de URLs de Callback

Los callbacks de OAuth deben estar configurados en tu GitHub App:
- Producción: `https://hot-potato-pr-dashboard.netlify.app/auth/callback`
- Development: `https://development--hot-potato-pr-dashboard.netlify.app/auth/callback`
- Local: `http://localhost:5173/auth/callback` (para desarrollo)

## Configuración de GitHub App

Sigue la guía detallada en [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) para:
1. Crear una GitHub App en tu cuenta personal u organización
2. Configurar permisos necesarios (PRs, Issues, Metadata, etc.)
3. Habilitar User-to-Server OAuth para login de usuarios
4. Instalar la app en tus repositorios
5. Obtener las credenciales necesarias (App ID, Installation ID, Private Key, Client ID, Client Secret)
6. Transferir a organización (opcional)

## Uso

### Acceso y Autenticación

1. Accede a la URL del dashboard
2. Haz login con tu cuenta de GitHub
3. Autoriza la aplicación
4. Dependiendo de tu rol, tendrás diferentes permisos:
   - **Guest**: Solo visualización
   - **Developer**: Edición de PRs (urgente/rápida, assignees/reviewers)
   - **Admin**: Configuración de repositorios + permisos de developer
   - **Superadmin**: Acceso completo + gestión de roles

### Dashboard Principal

**Stats Cards (clickeables como filtros):**
- **Total PRs**: Muestra todas las PRs (click = desactiva todos los filtros)
- **Urgentes**: PRs con label 🔥 urgent
- **Rápidas**: PRs con label ⚡ quick
- **Asignación incompleta**: PRs sin assignee O sin reviewer
- **Sin assignee**: PRs sin revisor principal
- **Sin reviewer**: PRs sin revisores solicitados

**Sistema de Colores:**
- 🟤 **Marrón** (`border-amber-700`): Con assignee (OK)
- 🟡 **Amarillo** (`border-yellow-400`): Sin assignee, <4h (warning)
- 🔴 **Rojo** (`border-red-400`): Sin assignee, >5 días (crítico)

**Filtros:**
- 5 filtros inclusivos (lógica OR)
- Checkboxes accesibles con `<label>`
- Dropdown de repositorios (muestra todos los configurados)

**Acciones por PR (solo developer/admin/superadmin):**
- Toggle urgente/rápida (botones con iconos)
- Selección de assignees (incluye autor PR)
- Selección de reviewers (excluye autor + assignees actuales)
- Ver en GitHub (botón outline)

### Vista "Mis PRs"

Dos secciones plegables independientes:
1. **PRs Creadas por Mí**: Donde eres el autor
2. **PRs Asignadas a Mí**: Donde estás como assignee o reviewer

Cada sección con:
- Contador de PRs
- Estado colapsable independiente
- Funcionalidad completa de edición

### Vista "Revisores"

Muestra carga de trabajo por revisor:
- Tabla colapsable con PRs individuales
- Muestra TODOS los usuarios registrados (incluso con 0 PRs)
- Ordenamiento: Por cantidad PRs (desc) → username (asc)
- IDs determinísticos para estabilidad

### Vista "PRs en Activo"

Agrupa PRs activas por creador:
- Solo usuarios con PRs creadas
- Tabla colapsable con detalles
- Badges de assignees/reviewers

### Panel de Configuración (Admin/Superadmin)

1. **Límites de tiempo** (dos columnas en desktop):
   - Tiempo límite de asignación (por defecto: 4 horas)
   - Máximo de días abierto (por defecto: 5 días)

2. **Gestión de repositorios**:
   - Agregar repos (formato: `owner/repo`)
   - Eliminar repos
   - Habilitar/deshabilitar repos temporalmente
   - Validación de acceso automática

3. **Sistema de notificaciones**:
   - Toasts de éxito (verde)
   - Toasts de error (rojo)
   - Toasts de advertencia (amarillo)

### Gestión de Roles (Solo Superadmin)

Panel de administración para gestionar roles:
- Vista completa de roles y sus permisos
- Instrucciones para configurar roles mediante Netlify CLI
- Badge de rol en perfil de usuario con colores distintivos

## Netlify Functions Disponibles

### Funciones de Autenticación
- **`GET /api/auth-login`** - Inicia el flujo OAuth con GitHub
  - Retorna URL de autorización de GitHub

- **`GET /api/auth-callback`** - Procesa callback de OAuth
  - Query params: `code` (authorization code)
  - Intercambia código por token de GitHub
  - Valida whitelist (si está configurada)
  - Genera JWT con información del usuario y rol

- **`GET /api/auth-me`** - Verifica sesión actual
  - Header: `Authorization: Bearer <jwt-token>`
  - Retorna información del usuario autenticado
  - Protegido con middleware `requireAuth`

### Funciones de Datos
- **`GET /api/prs`** - Obtiene todas las PRs abiertas
  - Retorna PRs con metadata calculada (estado, tiempo abierto, etc.)
  - Usa Netlify Blobs para leer configuración
  - Agrupa peticiones por owner para optimizar llamadas a GitHub API
  - Incluye información de reviewers (requested + completed reviews)
  - Filtra bots automáticamente

- **`GET /api/collaborators`** - Lista colaboradores de un repositorio
  - Query params: `owner`, `repo`
  - Retorna usuarios con acceso (excluye bots)
  - Protegido con autenticación

### Funciones de Configuración
- **`GET/POST /api/config`** - Gestiona la configuración del dashboard
  - Almacena/recupera configuración en Netlify Blobs
  - Configuración incluye: tiempo SLA, max días, lista de repositorios
  - Solo accesible por admin/superadmin

- **`GET/POST /api/get-user-roles`** - Gestiona roles de usuarios
  - GET: Retorna todos los usuarios con sus roles
  - POST: Actualiza roles (solo superadmin)
  - Lee variable de entorno `USER_ROLES`

### Funciones de Gestión de PRs
- **`POST /api/toggle-urgent`** - Marca/desmarca PR como urgente
  - Body: `{ owner, repo, pull_number, isUrgent }`
  - Gestiona el label "🔥 urgent" (color: d73a4a)
  - Solo developer/admin/superadmin

- **`POST /api/toggle-quick`** - Marca/desmarca PR como rápida
  - Body: `{ owner, repo, pull_number, isQuick }`
  - Gestiona el label "⚡ quick" (color: fbca04)
  - Solo developer/admin/superadmin

- **`POST /api/assign-reviewers`** - Asigna revisores a una PR
  - Body: `{ owner, repo, pull_number, reviewers: string[], action: 'add'|'remove' }`
  - Restricción: No puede incluir al autor de la PR
  - Solo developer/admin/superadmin

- **`POST /api/assign-assignees`** - Asigna assignees a una PR
  - Body: `{ owner, repo, pull_number, assignees: string[], action: 'add'|'remove' }`
  - Solo developer/admin/superadmin

### Funciones de Validación
- **`POST /api/validate-repo`** - Valida acceso a un repositorio
  - Body: `{ owner, repo }`
  - Verifica que la GitHub App tenga permisos
  - Retorna información del repositorio si es accesible

## Netlify Blobs

El proyecto utiliza **Netlify Blobs** como sistema de almacenamiento para:

### Stores Utilizados
- **`pr-dashboard-config`** (global scope): Configuración del dashboard
  - Key `config`: Objeto con `assignmentTimeLimit`, `maxDaysOpen`, `repositories`
  - Scope global para persistir entre deploys
  - Consistencia eventual por defecto

### Uso en Desarrollo Local
- Los Blobs funcionan automáticamente en `netlify dev` (modo sandbox)
- Los datos se almacenan localmente en `.netlify/blobs-serve`
- No requiere configuración adicional

### Ejemplo de Uso
```typescript
import { getStore } from "@netlify/blobs";

// Leer configuración
const configStore = getStore("pr-dashboard-config");
const config = await configStore.get("config", { type: "json" });

// Guardar configuración
await configStore.setJSON("config", {
  assignmentTimeLimit: 4,
  maxDaysOpen: 5,
  repositories: [...]
});
```

## Estructura del Proyecto

```
hot-potato-pr-dashboard/
├── netlify/
│   └── functions/              # Netlify serverless functions
│       ├── auth-login.mts              # Iniciar OAuth
│       ├── auth-callback.mts           # Procesar OAuth callback
│       ├── auth-me.mts                 # Verificar sesión
│       ├── get-prs.mts                 # Obtener PRs de GitHub
│       ├── toggle-urgent.mts           # Gestionar label urgente
│       ├── toggle-quick.mts            # Gestionar label quick
│       ├── assign-reviewers.mts        # Asignar revisores
│       ├── assign-assignees.mts        # Asignar assignees
│       ├── get-collaborators.mts       # Obtener colaboradores
│       ├── validate-repo.mts           # Validar repositorio
│       ├── config.mts                  # Gestionar configuración
│       ├── get-user-roles.mts          # Gestionar roles
│       ├── auth/
│       │   ├── jwt.mts                 # Utilidades JWT
│       │   └── middleware.mts          # Auth middleware
│       └── lib/
│           └── github-auth.mts         # Autenticación GitHub App
├── src/
│   ├── components/             # Componentes React
│   │   ├── ui/                         # Shadcn/ui components
│   │   ├── app-sidebar.tsx             # Sidebar navigation
│   │   ├── nav-user.tsx                # User dropdown
│   │   ├── Dashboard.tsx               # Vista principal
│   │   ├── MyPRsView.tsx               # Vista "Mis PRs"
│   │   ├── TeamAssignedView.tsx        # Vista "Revisores"
│   │   ├── TeamCreatedView.tsx         # Vista "PRs en Activo"
│   │   ├── PRCard.tsx                  # Card de PR individual
│   │   ├── ConfigView.tsx              # Panel de configuración
│   │   ├── RoleManagementView.tsx      # Gestión de roles
│   │   ├── LoginScreen.tsx             # Pantalla de login
│   │   └── AuthCallback.tsx            # Callback OAuth
│   ├── stores/
│   │   └── authStore.ts                # Zustand store (auth)
│   ├── hooks/
│   │   └── usePermissions.ts           # Hooks de permisos/roles
│   ├── types/                  # TypeScript types
│   │   └── github.ts                   # Tipos de GitHub y PR
│   ├── utils/                  # Utilidades
│   │   ├── prHelpers.ts                # Helpers para PRs
│   │   └── env.ts                      # Detección de entorno
│   ├── vite-env.d.ts           # Tipos para variables de Netlify
│   └── App.tsx                 # Root + protected routes
├── netlify.toml                # Configuración de Netlify
├── vite.config.ts              # Configuración Vite (inyecta env vars)
├── CLAUDE.md                   # Contexto completo del proyecto
├── GITHUB_APP_SETUP.md         # Guía de configuración
└── CHANGELOG.md                # Historial de cambios

```

## Optimistic Updates

El proyecto implementa optimistic updates para una UX fluida:

### Patrón de Implementación
```typescript
// 1. onMutate: cancelQueries → snapshot → setQueryData optimista → return snapshot
// 2. onSuccess: NO invalidateQueries (mantiene update optimista)
// 3. onError: Restore snapshot
```

### Mutaciones con Optimistic Updates
- Toggle urgente/rápida: Actualiza boolean + labels array
- Toggle assignee/reviewer: Actualiza arrays + flags `missingAssignee`/`missingReviewer`
- **Crítico**: QueryKey `['prs', isTestMode]` debe ser consistente en todas las mutaciones

## Detección de Entorno

### Sistema de Badges de Desarrollo
- Badge "🚧 DEV" en header (solo en development)
- Ribbon diagonal en esquina superior derecha (gradiente amarillo)
- Texto en footer con nombre de rama y contexto
- Detección automática mediante variables de Netlify

### Variables de Entorno Inyectadas
```typescript
// Inyectadas en build time por vite.config.ts
declare const __BRANCH__: string;      // "main", "development", "local"
declare const __CONTEXT__: string;     // "production", "branch-deploy", "local"
```

### Helpers de Utilidad
```typescript
import { isDevelopmentBuild, getBranchName, getBuildContext } from '@/utils/env';

isDevelopmentBuild();  // true si branch !== "main"
getBranchName();       // "development", "main", "local"
getBuildContext();     // "production", "branch-deploy", "local"
```

## Migración a Organización

Una vez que hayas probado el dashboard con tu cuenta personal y quieras usarlo en tu organización:

1. Transfiere la GitHub App a la organización (ver [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md))
2. Actualiza los callbacks URLs en la GitHub App
3. No necesitas cambiar ninguna configuración en Netlify
4. Los permisos se mantienen
5. La configuración de repos se mantiene
6. Actualiza la variable `USER_ROLES` con los usuarios de la organización

## Troubleshooting

### Problemas Comunes

**Error: "Authentication required"**
- Verifica que las variables `GITHUB_APP_CLIENT_ID` y `GITHUB_APP_CLIENT_SECRET` estén configuradas
- Revisa que el callback URL esté correcto en la GitHub App

**Error: "Access denied"**
- Si `ALLOWED_GITHUB_USERS` está configurada, verifica que tu usuario esté en la lista
- Si no está configurada, cualquier usuario puede acceder

**No aparecen PRs**
- Verifica que los repositorios estén agregados en configuración
- Verifica que la GitHub App tenga acceso a esos repositorios
- Revisa que las variables `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID` y `GITHUB_APP_PRIVATE_KEY` estén correctas

**Collapsibles no funcionan en producción**
- IDs deben ser determinísticos (NUNCA usar `Math.random()` o `Date.now()`)
- Usar valores estables como usernames o PR numbers

Ver más detalles en [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md)

## Convenciones de Desarrollo

### Shadcn/ui (OBLIGATORIO)
- **SIEMPRE** usar Shadcn/ui para componentes de UI
- **SIEMPRE** consultar documentación antes de crear componentes
- **NUNCA** crear componentes custom si existe en Shadcn
- Workflow: Docs → `npx shadcn@latest add` → personalizar con Tailwind

### Notificaciones
- **SIEMPRE** usar Sonner (toasts) en lugar de `alert()` nativo
- `toast.error()` para errores críticos
- `toast.warning()` para advertencias
- `toast.success()` para confirmaciones exitosas

### Console Logging
- Solo errores críticos (❌) con detalles completos
- Advertencias (⚠️) para duplicados/validaciones
- NO loguear operaciones exitosas (usar toasts para feedback)

### Root Cause Analysis para Bugs
1. Comparar comportamiento (local vs prod)
2. Revisar código que funciona (buscar patrones)
3. Analizar diferencias de entorno
4. Identificar assumptions incorrectas
5. Buscar state inconsistencies
6. Validar con datos reales

## Roadmap

- [ ] Notificaciones push (PRs críticas)
- [ ] Métricas históricas por equipo
- [ ] Integración Slack/Discord
- [ ] Asignación automática de reviewers basada en carga de trabajo
- [ ] Dashboard de métricas de equipo
- [ ] Exportar reportes

## Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Abre un issue para discutir cambios mayores
2. Sigue las convenciones del proyecto (ver CLAUDE.md)
3. Actualiza CHANGELOG.md con tus cambios
4. Usa conventional commits: `feat:`, `fix:`, `docs:`, etc.
5. Incluye el footer de Claude Code attribution en commits

## Licencia

ISC

## Versión

Versión actual: **2.0.0**

Ver historial completo de cambios en [CHANGELOG.md](./CHANGELOG.md)
