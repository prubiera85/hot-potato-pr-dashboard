# Changelog

All notable changes to Hot Potato PR Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-19

### Added
- Changelog to track all changes
- Version display in footer from package.json
- Colorful console log with potato emoji showing version on app load

### Changed
- Auto-refresh interval increased from 2 to 5 minutes

### Fixed
- Comment counts now display correctly (general comments + code review comments)
- Performance improvement by using pulls.get() for accurate comment data

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
