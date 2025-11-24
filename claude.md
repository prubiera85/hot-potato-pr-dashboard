# HotPotato PR Dashboard - Claude Context

## Descripción del Proyecto

HotPotato PR Dashboard es una aplicación web que ayuda a gestionar Pull Requests de GitHub de manera visual e intuitiva. El concepto principal es que "las PRs sin asignar son como patatas calientes - ¡hay que pasarlas rápido!"

**Versión Actual**: 1.1.1

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI)
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Deployment**: Netlify
- **Backend**: Netlify Functions (Serverless)
- **Auto-refresh**: Cada 5 minutos

## Estructura del Proyecto

```
pr-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/           # Componentes UI de Shadcn
│   │   ├── Dashboard.tsx # Componente principal del dashboard
│   │   ├── PRCard.tsx    # Tarjeta individual de PR
│   │   └── ConfigPanel.tsx # Panel de configuración
│   ├── types/
│   │   └── github.ts     # Tipos de TypeScript
│   ├── utils/
│   │   ├── prHelpers.ts  # Funciones auxiliares
│   │   └── dummyData.ts  # Datos de prueba
│   └── App.tsx           # Componente raíz
├── netlify/functions/    # Funciones serverless
└── public/              # Assets estáticos
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

1. **El assignee es el revisor principal**: El assignee en este equipo representa al revisor principal que debe aprobar la PR, no a quien trabaja en ella
2. **El reviewer NO afecta los colores**: Solo el assignee determina el color del borde
3. **Los filtros son inclusivos**: Mostrar items que cumplan con AL MENOS UNO de los filtros activos
4. **Tooltips inmediatos**: Siempre usar `delayDuration={0}` en TooltipProvider para tooltips instantáneos
5. **Stats cards con tooltips**: Todas las stats cards tienen tooltips explicativos que aparecen instantáneamente
6. **Colores consistentes**: Usar la paleta amber para "patata", yellow para warnings, red para críticos
7. **Accesibilidad**: Checkboxes dentro de labels, tooltips descriptivos, colores con buen contraste
8. **Stats cards clickeables**: Comportamiento exclusivo (click = solo ese filtro activo)
9. **Repositorios siempre visibles**: El selector muestra todos los repos configurados, tengan o no PRs
10. **Versionado automático**: La versión se lee de package.json y se muestra en footer y console
11. **Botones ocultos**: Config, Urgent y Quick están ocultos por CSS hasta implementar autenticación
12. **Auto-refresh**: Cada 5 minutos (no en modo test)
13. **Comentarios filtrados**: Los comentarios excluyen bots y Linear bot automáticamente
14. **Comentarios desglosados**: Se muestran comentarios generales + comentarios de código por separado (ambos filtrados)
15. **Exclusión de bots**: Los usuarios bot (tipo "Bot" o con "[bot]" en el nombre) se excluyen automáticamente de assignees, reviewers y comentarios
16. **Exclusión de Linear**: Los comentarios de Linear bot se excluyen automáticamente del conteo
17. **Reviewers completos**: Se muestran tanto reviewers solicitados como aquellos que ya completaron su review
18. **Teams como reviewers**: Se soportan y muestran equipos completos asignados como reviewers

## Próximas Mejoras Potenciales

- [ ] Sistema de autenticación con contraseña
- [ ] Reactivar botones de configuración y acciones (tras autenticación)
- [ ] Notificaciones push cuando una PR se vuelve crítica
- [ ] Métricas de tiempo de respuesta por equipo
- [ ] Integración con Slack
- [ ] Filtros personalizables avanzados
- [ ] Dashboard de analíticas históricas
- [ ] Asignación automática de reviewers
