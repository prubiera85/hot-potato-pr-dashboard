# HotPotato PR Dashboard - Claude Context

## Descripción del Proyecto

HotPotato PR Dashboard es una aplicación web que ayuda a gestionar Pull Requests de GitHub de manera visual e intuitiva. El concepto principal es que "las PRs sin asignar son como patatas calientes - ¡hay que pasarlas rápido!"

**Versión Actual**: 2.0.0

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI)
- **State Management**: React Query (TanStack Query) + Zustand (Auth)
- **Authentication**: GitHub OAuth + JWT
- **Icons**: Lucide React
- **Deployment**: Netlify
- **Backend**: Netlify Functions (Serverless)
- **Auto-refresh**: Cada 5 minutos

## Estructura del Proyecto

```
pr-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes UI de Shadcn
│   │   │   ├── sidebar.tsx   # Componente sidebar con primitivos
│   │   │   ├── breadcrumb.tsx # Componente de breadcrumbs
│   │   │   ├── separator.tsx  # Componente separador
│   │   │   └── ...           # Otros componentes UI
│   │   ├── app-sidebar.tsx   # Sidebar principal con navegación
│   │   ├── nav-user.tsx      # Componente de usuario estilo sidebar-07
│   │   ├── Dashboard.tsx     # Componente principal del dashboard
│   │   ├── MyPRsView.tsx     # Vista de "Mis PRs" (placeholder)
│   │   ├── TeamView.tsx      # Vista por usuario (placeholder)
│   │   ├── PRCard.tsx        # Tarjeta individual de PR
│   │   ├── ConfigPanel.tsx   # Panel de configuración
│   │   ├── LoginScreen.tsx   # Pantalla de login con GitHub OAuth
│   │   ├── AuthCallback.tsx  # Maneja callback de OAuth
│   │   └── UserMenu.tsx      # Menú de usuario (legacy, replaced by nav-user)
│   ├── hooks/
│   │   └── use-mobile.tsx    # Hook para detectar dispositivos móviles
│   ├── stores/
│   │   └── authStore.ts      # Zustand store para autenticación
│   ├── types/
│   │   └── github.ts         # Tipos de TypeScript
│   ├── utils/
│   │   ├── prHelpers.ts      # Funciones auxiliares
│   │   ├── dummyData.ts      # Datos de prueba
│   │   └── auth.ts           # Funciones de autenticación
│   └── App.tsx               # Componente raíz con sidebar y navegación
├── netlify/functions/
│   ├── auth-login.mts        # Inicia flujo OAuth
│   ├── auth-callback.mts     # Procesa callback de OAuth
│   ├── auth-me.mts           # Verifica sesión actual
│   └── auth/
│       ├── jwt.mts           # Utilidades JWT
│       └── middleware.mts    # Middleware de autenticación
└── public/                   # Assets estáticos
```

## Sistema de Colores

### Colores de Tarjetas de PR

El color de una tarjeta de PR está determinado **únicamente por el estado del assignee** (no por el reviewer):

1. **Marrón Patata** (`border-amber-700`, `text-amber-800/900`)
   - PR con assignee asignado
   - Estado normal, todo OK

2. **Amarillo** (`border-yellow-400`, `text-yellow-600/800`)
   - PR sin assignee
   - Dentro del límite de tiempo configurado (por defecto 4 horas)
   - Estado de warning

3. **Rojo** (`border-red-400`, `text-red-600/800`)
   - PR sin assignee Y ha excedido el límite de días abierta (por defecto 5 días)
   - Estado crítico

### Indicador de Tiempo

El tiempo que lleva abierta una PR se muestra con un icono de reloj:

- **Verde** (`text-green-600`): Dentro del límite de días permitidos
- **Rojo con animación** (`text-red-600`, `animate-ring`): Ha excedido el límite de días

### Colores de Stats Cards

Las stats cards ahora son **botones clickeables** que funcionan como filtros rápidos:

**Estados:**
- **Activa** (filtro seleccionado): Fondo de color, borde de color, iconos y texto en color, opacidad 100%
- **Inactiva** (filtro no seleccionado): Fondo gris (`bg-gray-100`), borde gris (`border-gray-300`), iconos y texto gris, opacidad 60%

**Cards disponibles:**
1. **Total PRs**: Marrón patata - Activa todos los filtros
2. **Urgentes**: Rojo - Filtra solo PRs urgentes
3. **Rápidas**: Amarillo - Filtra solo PRs rápidas
4. **Sin assignee**: Naranja oscuro - Filtra PRs sin assignee (sin revisor principal para aprobar)
5. **Sin reviewer**: Naranja medio - Filtra PRs sin reviewer
6. **Asignación incompleta**: Naranja claro - Filtra PRs sin assignee O sin reviewer

**Tooltips de Stats Cards:**
Todas las stats cards tienen tooltips instantáneos (`delayDuration={0}`) que explican qué hace cada filtro:
- **Total PRs**: "Mostrar todas las PRs (activa todos los filtros)"
- **Urgentes**: "PRs marcadas con label 🔥 urgent"
- **Rápidas**: "PRs marcadas con label ⚡ quick"
- **Sin assignee**: "PRs sin revisor principal asignado para aprobarlas"
- **Sin reviewer**: "PRs que no tienen persona asignada para revisarlas"
- **Asignación incompleta**: "PRs sin assignee O sin reviewer (o ambos)"

### Colores del Header

- **Fondo**: Amarillo `#ffeb9e`
- **Título**: "Hot" en rojo (`text-red-600`), resto en negro
- **Botones**: Color patata (`bg-amber-700 hover:bg-amber-800`)

## Sistema de Autenticación

### Arquitectura de Autenticación

La aplicación utiliza **GitHub OAuth (User-to-Server flow)** con la GitHub App existente, no requiere una OAuth App separada. El flujo completo es:

1. **Usuario no autenticado** → Pantalla de login (`LoginScreen.tsx`)
2. **Click en "Sign in with GitHub"** → Redirige a GitHub OAuth (`/api/auth-login`)
3. **Usuario autoriza en GitHub** → GitHub redirige a callback (`/auth/callback`)
4. **Callback procesa código** → Intercambia por access token, obtiene info de usuario
5. **Whitelist check** → Valida si el usuario está en la lista permitida
6. **Genera JWT** → Token con expiración de 7 días
7. **Guarda en localStorage** → Zustand store persiste el token y usuario
8. **Usuario autenticado** → Acceso al dashboard

### Variables de Entorno

Configuradas en Netlify (Production y Development):

```bash
# GitHub App OAuth
GITHUB_APP_CLIENT_ID=Iv23liMJt35aZuKXNpMX
GITHUB_APP_CLIENT_SECRET=9a88fa126de4e1f4a282a1da52b24bd60d7b3480

# JWT
JWT_SECRET=super-secret-jwt-key-$(openssl rand -hex 16)

# Whitelist (opcional - actualmente NO configurada = acceso abierto)
# ALLOWED_GITHUB_USERS=prubiera,user2,user3
```

### Componentes de Autenticación

#### LoginScreen.tsx

Pantalla de login mostrada a usuarios no autenticados:
- Diseño centrado con logo de patata
- Botón "Sign in with GitHub" con icono de GitHub
- Manejo de errores (muestra mensaje si hay error en query params)
- Explicación del propósito de la autenticación
- Usa Shadcn Button y Card components

```typescript
const handleLogin = async () => {
  setError(null);
  try {
    await initiateGitHubLogin();
  } catch (err) {
    setError('Error al iniciar sesión');
  }
};
```

#### AuthCallback.tsx

Procesa el callback de GitHub OAuth:
- Extrae el código de autorización de la URL
- Maneja errores de OAuth (access_denied, etc.)
- Intercambia código por token mediante `/api/auth-callback`
- Guarda token y usuario en authStore
- Limpia la URL (reemplaza con `/`)
- Redirige al dashboard

```typescript
const code = params.get('code');
const error = params.get('error');

if (error) {
  navigate(`/?error=${error}`);
  return;
}

const { token, user } = await handleOAuthCallback(code);
login(token, user);
window.history.replaceState({}, document.title, '/');
onSuccess();
```

#### UserMenu.tsx

Menú dropdown con avatar del usuario:
- Avatar con imagen de GitHub (fallback a iniciales)
- Nombre y username
- Email (si disponible)
- Opciones: Mi perfil, Configuración, Cerrar sesión
- Logout limpia el store y recarga la página
- Usa Shadcn DropdownMenu y Avatar components

```typescript
const handleLogout = () => {
  logout();
  window.location.reload();
};
```

#### authStore.ts (Zustand)

Store de autenticación con persistencia en localStorage:
- Estado: `user`, `token`, `isAuthenticated`
- Acciones: `login(token, user)`, `logout()`
- Persiste automáticamente en localStorage con key `auth-storage`
- Se restaura automáticamente al recargar la página

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Funciones Serverless de Autenticación

#### auth-login.mts

Endpoint: `GET /api/auth-login`

Inicia el flujo OAuth:
- Construye URL de autorización de GitHub
- Incluye `client_id`, `redirect_uri`, y `scope` (read:user, user:email)
- Retorna la URL al frontend para redirigir

```typescript
const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
githubAuthUrl.searchParams.set('client_id', clientId);
githubAuthUrl.searchParams.set('redirect_uri', callbackUrl);
githubAuthUrl.searchParams.set('scope', 'read:user user:email');
return new Response(JSON.stringify({ authUrl: githubAuthUrl.toString() }));
```

#### auth-callback.mts

Endpoint: `GET /api/auth-callback?code=xxx`

Procesa el callback de OAuth:
1. Intercambia código por access token en GitHub
2. Usa el token para obtener información del usuario
3. Verifica whitelist (si está configurada)
4. Genera JWT con información del usuario
5. Retorna token y usuario al frontend

```typescript
// Intercambio de código
const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
  method: 'POST',
  body: JSON.stringify({ client_id, client_secret, code }),
});

// Obtener usuario
const userResponse = await fetch('https://api.github.com/user', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Verificar whitelist
if (!isUserAllowed(githubUser.login)) {
  return new Response(JSON.stringify({ error: 'User not allowed' }), { status: 403 });
}

// Generar JWT
const token = generateToken(user);
return new Response(JSON.stringify({ token, user }));
```

#### auth-me.mts

Endpoint: `GET /api/auth-me`

Verifica la sesión actual:
- Requiere header `Authorization: Bearer <token>`
- Usa middleware `requireAuth` para validar JWT
- Retorna información del usuario si el token es válido

```typescript
export default async (request: Request) => {
  const user = await requireAuth(request);
  return new Response(JSON.stringify({ user }));
};
```

#### auth/jwt.mts

Utilidades para manejo de JWT:

**Funciones:**
- `generateToken(user)`: Genera JWT con expiración de 7 días
- `verifyToken(token)`: Verifica y decodifica JWT
- `isUserAllowed(login)`: Verifica si usuario está en whitelist

```typescript
export function generateToken(user: UserPayload): string {
  const secret = Netlify.env.get('JWT_SECRET');
  return jwt.sign(user, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  const secret = Netlify.env.get('JWT_SECRET');
  return jwt.verify(token, secret) as JWTPayload;
}

export function isUserAllowed(login: string): boolean {
  const allowedUsers = Netlify.env.get('ALLOWED_GITHUB_USERS');
  if (!allowedUsers) return true; // Si no hay whitelist, permite todos

  const allowedList = allowedUsers.split(',').map(u => u.trim().toLowerCase());
  return allowedList.includes(login.toLowerCase());
}
```

#### auth/middleware.mts

Middleware de autenticación para proteger endpoints:

```typescript
export async function requireAuth(request: Request): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader || '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  return verifyToken(token);
}

function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}
```

### Protected Routes en App.tsx

La aplicación implementa protected routes a nivel del componente raíz:

```typescript
const { isAuthenticated, token, user, logout } = useAuthStore();
const [isVerifyingSession, setIsVerifyingSession] = useState(true);

// Verificar sesión al cargar
useEffect(() => {
  const verify = async () => {
    if (token && !user) {
      const verifiedUser = await verifySession(token);
      if (!verifiedUser) logout();
    }
    setIsVerifyingSession(false);
  };
  verify();
}, [token, user, logout]);

// Detectar callback de OAuth
const urlParams = new URLSearchParams(window.location.search);
const isCallback = urlParams.has('code') || urlParams.has('error');

// Mostrar loading durante verificación
if (isVerifyingSession) {
  return <div>Verificando sesión...</div>;
}

// Manejar callback
if (isCallback) {
  return <AuthCallback onSuccess={() => window.location.href = '/'} />;
}

// Redirigir a login si no está autenticado
if (!isAuthenticated) {
  return <LoginScreen />;
}

// Mostrar dashboard si está autenticado
return <Dashboard />;
```

### Whitelist de Usuarios

El sistema soporta una whitelist opcional de usuarios permitidos:

**Configuración Actual:**
- ✅ **Acceso abierto**: La variable `ALLOWED_GITHUB_USERS` NO está configurada
- ✅ Cualquier usuario con cuenta de GitHub puede hacer login

**Configuración:**
- Variable de entorno: `ALLOWED_GITHUB_USERS`
- Formato: Lista separada por comas de usernames de GitHub
- Ejemplo: `ALLOWED_GITHUB_USERS=prubiera,user2,user3`

**Comportamiento:**
- Si la variable NO está configurada → Permite todos los usuarios con cuenta de GitHub (modo actual)
- Si la variable ESTÁ configurada → Solo permite usuarios en la lista
- Validación case-insensitive (normaliza a lowercase)
- Error 403 si usuario no está permitido

**Restringir acceso (si se requiere en el futuro):**
```bash
netlify env:set ALLOWED_GITHUB_USERS "prubiera,user2,user3"
```

**Volver a acceso abierto:**
```bash
netlify env:unset ALLOWED_GITHUB_USERS
```

### Callbacks URL Configurados

La GitHub App tiene configuradas las siguientes callback URLs:

**Production:**
- `https://hot-potato-pr-dashboard.netlify.app/auth/callback`

**Development (Branch Deploy):**
- `https://development--hot-potato-pr-dashboard.netlify.app/auth/callback`

**Local Development:**
- `http://localhost:5173/auth/callback`

### Seguridad

**Medidas de seguridad implementadas:**

1. **JWT con expiración**: Tokens expiran en 7 días
2. **Whitelist opcional**: Control de acceso a nivel de usuario
3. **HTTPS obligatorio**: Netlify fuerza HTTPS en todos los ambientes
4. **Secrets en variables de entorno**: Nunca en código
5. **Token en localStorage**: Accesible solo al mismo dominio
6. **Verificación de sesión**: Al cargar la app, verifica token con backend
7. **Logout limpia todo**: Elimina token y recarga página

**Consideraciones:**
- El JWT_SECRET debe ser único por ambiente
- Los client secrets deben mantenerse privados
- Actualmente en modo acceso abierto (sin whitelist)

### Environments y Deploys

**Main (Production):**
- URL: `https://hot-potato-pr-dashboard.netlify.app`
- Deploy automático en push a `main`
- Variables de entorno de producción

**Development (Staging):**
- URL: `https://development--hot-potato-pr-dashboard.netlify.app`
- Deploy automático en push a `development`
- Variables de entorno de desarrollo
- Para testing con el equipo antes de producción

**Configuración en netlify.toml:**
```toml
[context.development]
  command = "npm run build"

[context.development.environment]
  NODE_ENV = "development"
```

## Sistema de Navegación

### Sidebar (Shadcn sidebar-07)

La aplicación usa un sidebar colapsible basado en el patrón sidebar-07 de Shadcn/ui:

**Características:**
- **Collapsible**: Se puede colapsar a modo icono con Ctrl/Cmd + B
- **Variant "inset"**: Contenido principal con bordes redondeados y sombra
- **Responsive**: En móvil se muestra como drawer (Sheet component)
- **Estructura de navegación**:
  - **Header**: Logo de patata clickeable (animación wiggle + popup GIF)
  - **Content**: Dos secciones de navegación
    - **Pull Requests**: "Todas las PRs", "Mis PRs"
    - **Equipo**: "Vista por Usuario"
  - **Footer**: Botón "Leyenda de colores" + NavUser component

**Componentes relacionados:**
- `app-sidebar.tsx`: Sidebar principal con toda la navegación
- `nav-user.tsx`: Componente de usuario estilo sidebar-07 con dropdown
- `ui/sidebar.tsx`: Primitivos del sidebar de Shadcn
- `hooks/use-mobile.tsx`: Hook para detectar dispositivos móviles

### Breadcrumbs

El header muestra breadcrumbs dinámicos en lugar del título:
- **Pull Requests** > **Todas las PRs** / **Mis PRs**
- **Equipo** > **Vista por Usuario**

Los breadcrumbs se actualizan automáticamente según la vista actual.

### Vistas Disponibles

1. **Todas las PRs** (`currentView='all'`): Vista principal del Dashboard
2. **Mis PRs** (`currentView='my-prs'`): Placeholder - PRs donde soy assignee o reviewer
3. **Vista por Usuario** (`currentView='team'`): Placeholder - Resumen por miembro del equipo

### NavUser Component

Reemplaza al antiguo UserMenu con mejor UX estilo sidebar-07:
- Avatar del usuario con foto de GitHub
- Nombre, username y email
- Dropdown con opciones:
  - Mi perfil
  - Configuración (abre ConfigPanel)
  - Cerrar sesión
- Se adapta al estado del sidebar (expandido/colapsado)
- Responsive: dropdown se posiciona según el dispositivo

## Componentes Principales

### Dashboard.tsx

Componente principal que contiene:
- Stats cards clickeables (métricas de PRs que funcionan como filtros)
- Tooltips instantáneos en stats cards explicando cada filtro
- Dropdown de filtros (Urgente, Rápida, Asignación incompleta, Sin assignee, Sin reviewer)
- Filtro de repositorios (muestra TODOS los repos configurados, incluso sin PRs)
- Ordenamiento de PRs
- Lista de PRs
- Estado vacío con GIF animado

**Características importantes:**
- Stats cards son botones con tooltips informativos instantáneos (`delayDuration={0}`)
- Stats cards con comportamiento exclusivo (click = solo ese filtro)
- Checkboxes con `<label>` para mejor UX
- Filtros activos controlan qué PRs se muestran (lógica OR/inclusiva)
- Auto-refresco cada 5 minutos (cuando no está en modo test)
- Estado vacío muestra GIF de matojo del desierto cuando no hay PRs

### PRCard.tsx

Tarjeta individual de PR que muestra:
- Información básica (título, número, autor)
- Estado visual con bordes de colores
- Tiempo abierta con icono de reloj
- Labels de GitHub
- Assignees y reviewers con avatares
- Botones de "Urgente" y "Rápida" (**actualmente ocultos por CSS**)
- Comentarios con tooltip descriptivo (desglose de comentarios generales vs código, filtrados sin bots)

**Lógica de colores:**
```typescript
let borderColor = 'border-amber-700'; // Default: con assignee
if (!hasAssignee) {
  if (isOverMaxDays) {
    borderColor = 'border-red-400'; // Crítico
  } else {
    borderColor = 'border-yellow-400'; // Warning
  }
}
```

### App.tsx

Componente raíz que maneja:
- Estado global de la aplicación
- Modales (Config, Help, GIF)
- Query de PRs y configuración
- Mutaciones para toggle de urgent/quick
- Header con botones de ayuda y configuración (**botón de configuración oculto por CSS**)
- Versionado dinámico desde package.json
- Console log con estilo y emoji de patata

## Características Clave

### Sistema de Filtros

**5 filtros disponibles:**
1. Urgente (🔥)
2. Rápida (⚡)
3. Asignación incompleta (assignee O reviewer)
4. Sin assignee (sin revisor principal para aprobar)
5. Sin reviewer

**Comportamiento:**
- Los filtros son inclusivos (OR): Muestra PRs que cumplan con AL MENOS UNO de los filtros activos
- Si desactivas todos, no muestra nada
- Si activas todos, muestra todo
- Por defecto: Todos activos

**Stats Cards como Filtros Rápidos:**
- Click en una stat card = Activa SOLO ese filtro (comportamiento exclusivo)
- Click en "Total PRs" = Activa todos los filtros
- Las cards inactivas se muestran en gris con 60% opacidad

### Tooltips Inmediatos

Todos los tooltips usan `delayDuration={0}` para aparecer instantáneamente:
- Botones de header (Ayuda, Configuración)
- Botones de PR (Urgente, Rápida)
- Contador de comentarios
- Avatares de usuarios

### Modal de Ayuda

Muestra una leyenda completa de colores que incluye:
- Estados de PRs con ejemplos visuales
- Indicadores de tiempo con iconos de reloj
- Valores de configuración dinámicos (muestra los números reales configurados)

### Configuración

Permite ajustar:
- `assignmentTimeLimit`: Horas antes de considerar warning (default: 4h)
- `maxDaysOpen`: Días máximos abierta antes de estado crítico (default: 5 días)
- Repositorios a monitorear
- Modo test (usa datos dummy)

**Nota**: El botón de configuración está actualmente oculto por CSS hasta implementar autenticación.

### Estado Vacío

Cuando no hay PRs para mostrar (por filtros o porque realmente no hay):
- Se muestra un GIF animado de un matojo (tumbleweed) del desierto
- Mensaje contextual según el motivo (sin PRs vs filtros vacíos)
- Diseño centrado con espaciado generoso

### Botones Ocultos Temporalmente

Por seguridad, los siguientes botones están ocultos con CSS hasta implementar autenticación:
- **Botón de Configuración** (Settings en header) - Clase: `config-button-hidden`
- **Botón "Urgente"** (Flame en PR cards) - Clase: `urgent-button-hidden`
- **Botón "Rápida"** (Zap en PR cards) - Clase: `quick-button-hidden`

**Implementación**: Regla CSS `display: none !important` en `src/index.css`
**Reactivar**: Eliminar las clases CSS del archivo `index.css`
**Código**: Toda la funcionalidad permanece intacta, solo oculta visualmente

## Convenciones de Código

### Nombres de Variables

- `pr`: Pull Request individual
- `prs`: Array de Pull Requests
- `hasAssignee`: Boolean si tiene assignee
- `isOverMaxDays`: Boolean si excedió días máximos
- `config`: Objeto de configuración

### Estilos Tailwind

- Preferir clases utilitarias de Tailwind
- Para colores específicos como `#ffeb9e`, usar `style={{ backgroundColor: '#ffeb9e' }}`
- Usar variantes de Tailwind (hover:, focus:, etc.)

### Componentes UI con Shadcn/ui

**OBLIGATORIO: Siempre usar Shadcn/ui para componentes de UI**

- **SIEMPRE** usar componentes de Shadcn/ui para cualquier elemento de interfaz
- **SIEMPRE** consultar el MCP server de Shadcn antes de crear o modificar componentes UI
- **NUNCA** crear componentes UI personalizados si existe una alternativa en Shadcn/ui
- Todos los tooltips deben tener `delayDuration={0}`
- Los checkboxes deben estar dentro de `<label>` para mejor accesibilidad

**Workflow obligatorio para componentes UI:**
1. Antes de crear/modificar UI, usar el MCP server de Shadcn (`mcp__shadcn__getComponent`)
2. Revisar la documentación y ejemplos del componente
3. Instalar el componente si no existe: `npx shadcn@latest add [component]`
4. Usar el componente siguiendo las convenciones de Shadcn/ui
5. Personalizar solo mediante Tailwind CSS y las props disponibles

**Componentes Shadcn/ui disponibles en el proyecto:**
- Button, Card, Checkbox, Dialog, DropdownMenu
- Input, Label, Select, Separator
- Sheet, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
- Avatar, AvatarImage, AvatarFallback
- Badge (para labels de GitHub)
- Sidebar, SidebarProvider, SidebarInset, SidebarTrigger (y todos los primitivos)
- Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator

**Theme Configuration:**
El proyecto usa el theme **Yellow** de Shadcn configurado en `src/index.css`:
- **Primary color**: Yellow-400 (`47.9 95.8% 53.1%`) - Amarillo vibrante
- **Primary foreground**: Yellow-900 (`26 83.3% 14.1%`) - Marrón oscuro
- **Ring/Focus**: Yellow para acentos de enfoque
- **Sidebar**: Colores yellow para estados activos y ring
- El theme está configurado tanto para modo light como dark

**Para consultar componentes:**
```typescript
// Listar todos los componentes disponibles
mcp__shadcn__getComponents

// Obtener documentación de un componente específico
mcp__shadcn__getComponent({ component: "button" })
```

## Integraciones

### GitHub API

Las funciones de Netlify se conectan a la API de GitHub para:
- Obtener PRs de repositorios configurados
- Obtener colaboradores de repos
- Actualizar labels de PRs (urgent/quick)
- Obtener comentarios individuales y filtrarlos (excluye bots y Linear bot)

**Lógica de Reviewers:**
- `requested_reviewers`: Reviewers solicitados que **aún NO han revisado** (se quitan automáticamente al completar review)
- `pulls.listReviews()`: Obtiene todos los reviews completados
- Se combinan ambas fuentes para mostrar reviewers pendientes + completados
- Se filtran automáticamente: bots (tipo "Bot" o con "[bot]" en nombre) y el autor de la PR

**Lógica de Comentarios:**
- `issues.listComments()`: Obtiene comentarios generales de la conversación
- `pulls.listReviewComments()`: Obtiene comentarios de código (review comments)
- Se filtran automáticamente comentarios de:
  - Bots (tipo "Bot" o con "[bot]" en nombre)
  - Linear bot (usuarios con "linear" en el login)
  - Comentarios sin usuario
- Fallback al conteo total si hay error en la obtención de comentarios individuales

### Labels de GitHub

El sistema usa dos labels especiales:
- `🔥 urgent`: Marca PRs urgentes
- `⚡ quick`: Marca PRs rápidas

## Modo Test

El modo test permite:
- Probar la UI sin configurar GitHub App
- Usa datos dummy definidos en `dummyData.ts`
- No hace llamadas a APIs externas
- Útil para desarrollo y demos

## Animaciones

### animate-ring

Animación CSS personalizada para el icono de reloj cuando una PR excede el límite:
```css
@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}
```

### animate-wiggle

Animación para el logo de patata en hover (definida en Tailwind config)

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Deploy (automático en push a main)
git push origin main

# Test mode
# Activar desde el panel de configuración en la UI
```

## Proceso de Desarrollo y Documentación

### Workflow de Cambios

Cada vez que se realiza un cambio que se despliega a producción, se debe seguir este proceso:

1. **Hacer el cambio de código**
2. **Actualizar CHANGELOG.md**
   - Agregar el cambio en la sección `[Unreleased]`
   - Clasificar como: Added, Changed, Fixed, Deprecated, Removed, o Security
   - Ser específico y claro sobre qué cambió
3. **Actualizar CLAUDE.md** (este archivo)
   - Si el cambio afecta la arquitectura, componentes o convenciones
   - Si introduce nuevas características o comportamientos
   - Si cambia el flujo de trabajo o proceso de desarrollo
4. **Actualizar README.md** (si existe)
   - Si el cambio afecta la instalación, configuración o uso de la aplicación
5. **Commit con mensaje descriptivo**
   - Usar conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
   - Incluir el footer con Claude Code attribution
6. **Push a main** (despliega automáticamente a Netlify)

### Cuándo Versionar

Cuando se acumula un conjunto significativo de cambios en `[Unreleased]`:
1. Mover la sección `[Unreleased]` a una nueva versión con fecha
2. Actualizar `package.json` con la nueva versión
3. Actualizar la versión en la parte superior de este archivo (CLAUDE.md)
4. Hacer commit: `release: bump version to X.Y.Z`

## Notas Importantes

1. **Autenticación obligatoria**: Todos los usuarios deben autenticarse con GitHub OAuth antes de acceder
2. **Acceso abierto**: Actualmente cualquier usuario con cuenta de GitHub puede acceder (whitelist desactivada)
3. **Whitelist configurable**: Se puede restringir acceso a usuarios específicos mediante variable de entorno si se requiere
4. **Sesión persistente**: El token JWT se guarda en localStorage y persiste 7 días
4. **Protected routes**: App.tsx maneja autenticación a nivel raíz antes de renderizar dashboard
5. **El assignee es el revisor principal**: El assignee en este equipo representa al revisor principal que debe aprobar la PR, no a quien trabaja en ella
6. **El reviewer NO afecta los colores**: Solo el assignee determina el color del borde
7. **Los filtros son inclusivos**: Mostrar items que cumplan con AL MENOS UNO de los filtros activos
8. **Tooltips inmediatos**: Siempre usar `delayDuration={0}` en TooltipProvider para tooltips instantáneos
9. **Stats cards con tooltips**: Todas las stats cards tienen tooltips explicativos que aparecen instantáneamente
10. **Colores consistentes**: Usar la paleta amber para "patata", yellow para warnings, red para críticos
11. **Accesibilidad**: Checkboxes dentro de labels, tooltips descriptivos, colores con buen contraste
12. **Stats cards clickeables**: Comportamiento exclusivo (click = solo ese filtro activo)
13. **Repositorios siempre visibles**: El selector muestra todos los repos configurados, tengan o no PRs
14. **Versionado automático**: La versión se lee de package.json y se muestra en footer y console
15. **Botones ahora visibles**: Config, Urgent y Quick ahora están visibles tras implementar autenticación
16. **Auto-refresh**: Cada 5 minutos (no en modo test)
17. **Comentarios filtrados**: Los comentarios excluyen bots y Linear bot automáticamente
18. **Comentarios desglosados**: Se muestran comentarios generales + comentarios de código por separado (ambos filtrados)
19. **Exclusión de bots**: Los usuarios bot (tipo "Bot" o con "[bot]" en el nombre) se excluyen automáticamente de assignees, reviewers y comentarios
20. **Exclusión de Linear**: Los comentarios de Linear bot se excluyen automáticamente del conteo
21. **Reviewers completos**: Se muestran tanto reviewers solicitados como aquellos que ya completaron su review
22. **Teams como reviewers**: Se soportan y muestran equipos completos asignados como reviewers
23. **Branch deploys**: Development branch tiene su propia URL de staging para testing

## Próximas Mejoras Potenciales

- [x] Sistema de autenticación con GitHub OAuth
- [x] Reactivar botones de configuración y acciones (tras autenticación)
- [ ] Filtro "Mis PRs" (mostrar solo PRs donde soy assignee o reviewer)
- [ ] Vista por usuario (resumen de PRs asignadas a cada miembro)
- [ ] Notificaciones push cuando una PR se vuelve crítica
- [ ] Métricas de tiempo de respuesta por equipo
- [ ] Integración con Slack
- [ ] Filtros personalizables avanzados
- [ ] Dashboard de analíticas históricas
- [ ] Asignación automática de reviewers
