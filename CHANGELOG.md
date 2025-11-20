# Changelog

All notable changes to Hot Potato PR Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
