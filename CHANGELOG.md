# Changelog

## [2.1.5] - 2026-04-24
- Enabled TypeScript strict mode and fixed all type safety issues.
- Added missing version field to `manifest.json`.
- Refined UI text to adhere to strict sentence case (e.g., "Subscription url", "Gist id").
- Updated `versions.json` and rebuilt the release bundle.

## [2.1.4] - 2026-04-08
- Fixed the remaining review-bot issue in sync automation error handling.
- Normalized the last settings description that still violated Obsidian UI sentence case checks.
- Rebuilt the release bundle so the shipped assets match the final review-safe source.

## [2.1.3] - 2026-04-08
- Refined plugin and settings UI copy to satisfy Obsidian review requirements.
- Fixed async callback and error-stringification issues flagged by ObsidianReviewBot.
- Rebuilt the release bundle after validation so `main.js`, `manifest.json`, and `versions.json` match the shipped version.

## [2.1.0] - 2026-04-06
- Refactor dependency injection for `FileClient`.
- Stable UIDs for tasks.
- Improved Day Planner integration.
- Complete vault indexing on startup and file creation.
- Support for dateless tasks (VTODO).
- Unified settings and metadata.
- Fixed TypeScript errors.
- Open source governance added.
