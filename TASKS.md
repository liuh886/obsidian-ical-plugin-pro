# Implementation Tasks

## Phase 1: Project Setup & Tools
- [ ] 1.1 Complete the `src/` directory by adding `main.ts` and `Settings.ts` (skeleton or refactored from existing `main.js`) so the plugin can actually compile via `esbuild`.
- [ ] 1.2 Implement a robust `ICalBuilder` class in `src/Service/ICalBuilder.ts` to replace manual string concatenation, handling RFC 5545 75-character line folding and CRLF line breaks.

## Phase 2: Performance & Caching (Incremental Indexing)
- [ ] 2.1 Create `src/Service/TaskIndex.ts` to manage a memory cache `Map<string, Task[]>` mapping file paths to their parsed tasks.
- [ ] 2.2 Wire up Vault event listeners (`app.vault.on('modify'`, `delete`, `rename`) in the plugin's `onload()` method to update `TaskIndex` incrementally instead of scanning all files every time.
- [ ] 2.3 Refactor the main export logic to read directly from `TaskIndex` instead of triggering a full vault scan.

## Phase 3: Parsing Engine & iCal Generation
- [ ] 3.1 Refactor `TaskFinder.ts` to feed into `TaskIndex`. Ensure the multi-line description parsing remains intact.
- [ ] 3.2 Refactor `IcalService.ts` to use the new `ICalBuilder` to safely generate the ICS content (no raw `\r\n` concatenations). Ensure `X-WR-TIMEZONE` and ALTREP cleanup logic is preserved.

## Phase 4: Final Assembly & Test
- [ ] 4.1 Update `package.json` scripts if necessary.
- [ ] 4.2 Run `npm install` and `npm run build` to verify the TypeScript compiles correctly into `main.js`.
- [ ] 4.3 Update `README.md` to reflect the new architecture.

## Phase 5: Community Plugin Submission Readiness
- [ ] 5.1 Rename plugin ID in `manifest.json` from `ical` to `obsidian-ical-plugin-pro` (or similar) to avoid conflicts in the Obsidian Plugin Store.
- [ ] 5.2 Ensure `LICENSE` is MIT and attribute original author.
- [ ] 5.3 Implement comprehensive `README.md` with configuration guides.
- [ ] 5.4 Run Linting and fix all TypeScript errors.
- [ ] 5.5 Submit to [Obsidian Releases](https://github.com/obsidianmd/obsidian-releases).

## Phase 6: Todo & Alarm Enhancements
- [ ] 6.1 **VALARM Support in ICalBuilder**: Update `ICalBuilder.ts` to support nested `VALARM` components (`beginAlarm`, `endAlarm`, `TRIGGER`, `ACTION`).
- [ ] 6.2 **Alarm Parsing**: Update `TaskFactory.ts` to recognize alarm triggers in markdown (e.g., `⏰ 15m` means alert 15 minutes before start).
- [ ] 6.3 **Priority Mapping**: Implement logic to map Obsidian task priorities (`⏫`, `🔼`, `🔽`) to iCalendar `PRIORITY` values (1-9).
- [ ] 6.4 **Global Alarm Settings**: Add settings to `Settings.ts` and `SettingsTab.ts` for default alarm offsets (e.g., "Always remind me 10 mins before events").
- [ ] 6.5 **Advanced VTODO metadata**: Enhance `IcalService.ts` to include more VTODO specific properties like `PERCENT-COMPLETE` or `CATEGORIES` based on tags.