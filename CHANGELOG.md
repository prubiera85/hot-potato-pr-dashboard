# Changelog

All notable changes to Hot Potato PR Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Sidebar Navigation (Shadcn sidebar-07)**
  - Collapsible sidebar with icon mode
  - Logo de patata clickeable con animación wiggle y popup de GIF
  - Sección "Pull Requests" con vistas "Todas las PRs" y "Mis PRs"
  - Sección "Equipo" con vista "Vista por Usuario"
  - NavUser component estilo sidebar-07 en el footer con dropdown mejorado
  - Botón de "Leyenda de colores" en el footer del sidebar
  - Responsive: drawer móvil con Sheet component
  - Variant "inset" para contenido principal con bordes redondeados y sombra
- **Breadcrumbs Navigation**
  - Navegación de migas de pan dinámica en el header
  - Muestra la sección actual (Pull Requests / Equipo) y la vista específica
  - Reemplaza el título "HotPotato PR Dashboard" duplicado
- **Theme Configuration**
  - Theme de Shadcn configurado con yellow como color primario
  - Colores consistentes para modo light y dark
  - Sidebar con colores yellow para estados activos
- **Placeholder Views**
  - MyPRsView component para vista de "Mis PRs"
  - TeamView component para vista por usuario del equipo
- **GitHub OAuth Authentication System**
  - Complete OAuth flow using existing GitHub App (User-to-Server tokens)
  - JWT-based session management with 7-day token expiration
  - LoginScreen component with GitHub sign-in button
  - AuthCallback component to process OAuth callback
  - UserMenu component with avatar, user info, and logout
  - Zustand store for authentication state with localStorage persistence
  - Protected routes implementation in App.tsx
  - Session verification on app load
  - Auth middleware for protecting serverless functions
- **Authentication Serverless Functions**
  - `/api/auth-login` - Initiates OAuth flow
  - `/api/auth-callback` - Processes OAuth callback and generates JWT
  - `/api/auth-me` - Verifies current session
  - JWT utilities and middleware for token management
- **User Whitelist System**
  - Optional whitelist via `ALLOWED_GITHUB_USERS` environment variable
  - Restricts access to specific GitHub users
  - Case-insensitive username validation
- **Development Environment**
  - Branch deploys configuration for `development` branch
  - Staging URL: `https://development--hot-potato-pr-dashboard.netlify.app`
  - Separate callback URL configuration for dev environment
- **UI Improvements**
  - Config button moved into UserMenu dropdown
  - User avatar with GitHub profile picture in header
  - Dropdown menu with profile, settings, and logout options
  - Better organized header layout
- Tooltips to all stat cards explaining what each filter does (instant display with delayDuration={0})
- Comment filtering to exclude bot comments (Linear bot, and other bots)

### Changed
- **App.tsx** - Refactored to support sidebar navigation
  - Integrated SidebarProvider and navigation state management
  - Added breadcrumbs navigation
  - Conditional view rendering based on currentView state
  - Removed help button from header (now in sidebar)
- **Header Layout**
  - Replaced title with breadcrumbs navigation
  - Simplified to only show SidebarTrigger and breadcrumbs
  - Removed leyenda button (now in sidebar)
- **Sidebar Components**
  - Renamed "PRs" section to "Pull Requests" for clarity
  - UserMenu replaced by NavUser component with better UX
  - Logo de patata centrado y redimensionado para modo colapsado
- **UI Components**
  - Added DropdownMenuGroup to dropdown-menu component
  - Added breadcrumb component from Shadcn
  - Added separator component from Shadcn
  - Created use-mobile hook for responsive behavior
- Renamed filter "Sin asignar" to "Asignación incompleta" for better clarity
- Updated tooltip for "Sin assignee" to clarify it refers to the main reviewer who approves the PR
- Comment counts now fetch individual comments and filter out bot authors (Linear, GitHub bots, etc.)

### Fixed
- PR authors are now correctly excluded from the reviewers list when they submit reviews on their own PRs
- Comment counts no longer include bot comments (Linear bot specifically excluded)

### Security
- **Authentication required for all access** - No more open access to the dashboard
- **JWT tokens with expiration** - 7-day token lifetime
- **Optional user whitelist** - Restrict access to authorized team members only
- **HTTPS enforced** - All authentication flows use secure connections
- **Secrets in environment variables** - No secrets in codebase
- Config, Urgent, and Quick buttons now visible (previously hidden, now protected by auth)

### Removed
- CSS classes for hiding Config, Urgent, and Quick buttons (no longer needed with auth)

## [1.1.1] - 2025-01-20

### Fixed
- Assignees and reviewers now update correctly from GitHub API
- PR details endpoint data now properly overrides initial list data for assignees/reviewers
- Reviewers now include all users: requested reviewers + those who already completed reviews
- Team reviewers are now displayed correctly below individual reviewer avatars
- Reviewer count now includes both individual reviewers and team reviewers
- Bot users (type "Bot" or with "[bot]" in username) are now excluded from assignees and reviewers lists

## [1.1.0] - 2025-01-19

### Added
- Changelog to track all changes
- Version display in footer from package.json
- Colorful console log with potato emoji showing version on app load
- Two new filter options: "Sin assignee" and "Sin reviewer" (5 filters total)
- Clickable stats cards that act as quick filters
- Animated tumbleweed GIF for empty state (no PRs)
- Visual indicators for active/inactive filters (color vs grayscale with opacity)
- Repository selector now shows all configured repos (even with 0 PRs)

### Changed
- Auto-refresh interval increased from 2 to 5 minutes
- Stats cards now function as exclusive filter buttons (click = only that filter active)
- Filter behavior: clicking a stat card activates only that filter
- All filters active by default (shows all PRs)
- Inactive cards display with gray background and 60% opacity
- Active cards show colored background and border
- Comment display logic to use pulls.get() for accurate counts

### Fixed
- Comment counts now display correctly (general comments + code review comments)
- Performance improvement by using pulls.get() for accurate comment data
- Repository selector now shows repos even when they have 0 PRs

### Security
- Configuration button temporarily hidden (CSS only)
- "Mark as Urgent" button temporarily hidden (CSS only)
- "Mark as Quick" button temporarily hidden (CSS only)
- All functionality intact, awaiting authentication implementation

## [1.0.0] - 2024-11-17

### Added
- Initial release of Hot Potato PR Dashboard
- GitHub PR monitoring with visual status indicators
- Color-coded PR cards based on assignment status
- Stats cards showing PR metrics (total, urgent, quick, unassigned)
- Filters for urgent, quick, and unassigned PRs
- Repository filter to show/hide specific repos
- PR sorting (newest/oldest first)
- Assignment time limit configuration
- Max days open configuration
- Test mode with dummy data
- Assignee and reviewer management UI
- Drag-and-drop interface for assigning team members
- GitHub App integration for authentication
- Netlify Functions backend for GitHub API interactions
- Auto-refresh functionality
- Help modal with color legend
- Configuration panel
- Labels support (urgent/quick)
- Comment count display with breakdown tooltip
- Time indicator with visual warnings
- Responsive design with Tailwind CSS
- Shadcn/ui components integration

### Changed
- Default PR sort order to newest first
- Status calculation based only on assignee (not reviewer)
- Improved button UX to prevent full page reload on toggle
- Filters are now inclusive (OR logic)
- Removed confusing "OVERDUE" text from cards

### Fixed
- Checkbox behavior in filters and repository list
- Missing comment fields in PR data
- Unused imports and functions cleanup
