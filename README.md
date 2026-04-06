# iCal Pro for Obsidian

Manage your tasks in Markdown and expose them to Google Calendar, Apple Calendar, and Outlook via standards-compliant iCalendar feeds.

![iCal Pro Illustration](assets/ical_pro_about.jpg)

> **The Professional Standard for Obsidian Calendar Sync.**
> - **High-Fidelity**: Strict RFC 5545 compliance (folding, CRLF, escaping).
> - **Zero Dependency**: Works natively with **Tasks** and **Day Planner** syntax without requiring those plugins to be installed.
> - **Privacy First**: Local-first architecture with optional GitHub Gist sync.
> - **Deep Logic**: Intelligent `VEVENT` vs `VTODO` semantic splitting.

## What It Does
...
- Supports Day Planner style date inheritance from headings and daily note filenames
- Syncs to a vault file or GitHub Gist
- Preserves Obsidian deep links back to source notes

## Supported Syntax

iCal Pro is built for compatibility. It recognizes popular task formats out-of-the-box:

| Feature | Syntax Example | iCal Mapping |
| :--- | :--- | :--- |
| **Dates** | `📅 2024-03-20` / `⏳ 2024-03-21` | `DUE` / `DTSTART` |
| **Priority** | `⏫ High` / `🔼 Medium` / `🔽 Low` | `PRIORITY: 1 / 5 / 9` |
| **Alarms** | `⏰ 15` (15 minutes before) | `VALARM` |
| **Recurrence**| `🔁 every weekday` | `RRULE` |
| **Time Range**| `09:00 - 10:30` | `DTSTART` & `DTEND` |
| **Context** | `## 2024-03-20` (Heading) | Inherited Date |

## Current Feature Set

- Multi-source export rules: bind multiple vault paths to calendar categories
- Filtering: global task filter, include/exclude tags, include/exclude categories
- Task fidelity:
  - priority mapping from Obsidian Tasks priority emoji to RFC 5545 `PRIORITY`
  - recurrence mapping for common `every ...` patterns to `RRULE`
  - task lifecycle mapping for `todo / in-progress / cancelled / completed`
  - optional `VALARM` export
- Rich parsing:
  - task body capture from lists, indented lines, and blockquotes
  - callout/blockquote task support such as `> - [ ] 09:00 ...`
  - summary and description sanitization for Obsidian / Dataview syntax
- Operability:
  - startup sync and periodic sync
  - sync preview with exported / filtered / `VEVENT` / `VTODO` counts
  - destination-by-destination sync result reporting
  - copyable diagnostics bundle with redacted settings and recent sync history
  - explanations for filtered tasks and `VTODO` downgrade reasons

## Calendar Semantics

- Timed task with date -> `VEVENT`
- Dated task without time -> `VTODO`
- Task without date -> floating `VTODO`

This is the default behavior in `EventsAndTodos` mode.

## Compatible Calendars

iCal Pro produces RFC 5545 `.ics` output intended to work with:

- Google Calendar subscription
- Apple Calendar
- Outlook
- Proton Calendar
- Thunderbird
- Other clients that support iCalendar subscriptions

Client support for `VTODO` varies. Apple-oriented ecosystems usually handle `VTODO` better than Google Calendar.

## Getting Started

1. Install with [BRAT](https://github.com/TfTHacker/obsidian42-brat) using `liuh886/obsidian-ical-plugin-pro`
2. Open the `iCal Pro` settings tab
3. Add at least one source path rule
4. Enable at least one destination:
   - local vault file export
   - GitHub Gist sync
5. If you use Gist, fill in username, Gist ID, and PAT, then click `Validate`
6. Click `Sync Now`
7. Subscribe to the generated raw Gist URL or local `.ics` file

## Settings Highlights

- `Scope & Discovery`: source path to category mapping
- `Scheduling & Alarms`: Day Planner mode, sync strategy, multi-date handling, alarms
- `Content & Filters`: task tag/category filters and completion filtering
- `Sync & Cloud Connectivity`: filename, local path, Gist sync, validation
- `Advanced & Diagnostics`: link formatting, auto-sync, debug mode, diagnostics workflow

The status card in settings shows:

- readiness state
- sync preview
- latest per-destination sync result
- diagnostics copy action

## Debugging & Logs

If you encounter issues, you can enable verbose logging:

1. Open **Settings** > **iCal Pro**.
2. Scroll to the **Advanced & Diagnostics** section.
3. Toggle **Debug Mode** to **ON**.
4. Open the Obsidian developer console (press `Ctrl+Shift+I` on Windows/Linux or `Cmd+Option+I` on macOS).
5. Look for logs prefixed with `[info][ical]` or `iCal Pro:`.

You can also use the **Copy Diagnostics** button in the status card to generate a redacted summary of your configuration and recent sync history to include in bug reports.

## Development

- `npm run build`
- `npm run typecheck`
- `npm run test:smoke`
- `npm run validate`

## License

MIT

---

## Support

If you find this plugin useful and want to support its development, you can buy me a coffee!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F7WYJ6B)
