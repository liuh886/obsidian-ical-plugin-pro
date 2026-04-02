# iCal Pro for Obsidian

**Turn your Obsidian tasks into a live, synced calendar.**

iCal Pro is a powerful synchronization engine that automatically scans your Obsidian vault for tasks with dates and generates a standard iCalendar (`.ics`) file. You can subscribe to this file in **Google Calendar, Apple Calendar, Outlook**, or any other calendar app to see your Obsidian schedule alongside your other commitments.

---

## 🚀 What can iCal Pro do for you?

- **📅 Automated Scheduling**: Simply add a date to any task in Obsidian (e.g., `- [ ] My meeting 2026-05-08`), and it instantly appears in your external calendar.
- **🔗 Deep Linking**: Every calendar event includes a direct `obsidian://` link. One click on your phone or desktop calendar takes you straight back to the exact note in your vault.
- **📝 Rich Context**: Unlike basic sync tools, iCal Pro captures the notes, quotes, and sub-items listed *under* your task and includes them in the calendar event's description.
- **⚡ Built for Scale**: Whether you have 10 notes or 10,000, iCal Pro’s memory-resident `TaskIndex` (Incremental Indexing) ensures your calendar updates instantly by only re-parsing modified files, never slowing down your Obsidian experience.
- **🛡️ RFC 5545 Compliant**: Uses a custom-built `ICalBuilder` that strictly adheres to the iCalendar standard, including mandatory 75-character line folding, CRLF line endings, and proper character escaping for maximum reliability across all calendar clients.
- **🌍 Travel-Ready**: Built-in timezone intelligence ensures your events stay pinned to the correct local time, no matter where you are in the world.

---

## 🛠️ How it works

### 1. Tagging Tasks with Dates
iCal Pro looks for tasks containing dates in the `YYYY-MM-DD` format. It also supports the "Tasks" plugin style emojis:
- `🛫 2026-05-08` (Start Date)
- `⏳ 2026-05-08` (Scheduled Date)
- `📅 2026-05-08` (Due Date)

### 2. Capturing Descriptions
If you provide additional context under a task using blockquotes (`>`) or indented lists, iCal Pro will include that text in the "Notes/Description" field of the calendar event.

### 3. Syncing to your Devices
Choose how you want to host your calendar:
- **Local File**: Save the `.ics` to your disk (best for local-only use or third-party sync like iCloud/Dropbox).
- **GitHub Gist**: Automatically push your calendar to a private or public Gist. This provides a permanent URL that Google Calendar or Apple Calendar can subscribe to from anywhere.

---

## ⚙️ Getting Started

1. **Install**: Download the latest release and place it in your `.obsidian/plugins/` folder.
2. **Configure**: Open Obsidian Settings -> **iCal Pro**.
3. **Setup GitHub Sync**:
   - Create a **[GitHub Personal Access Token](https://github.com/settings/tokens?type=beta)** with `Gist` permissions.
   - Create a new Gist at **[gist.github.com](https://gist.github.com/)**.
   - Copy the **Gist ID** from the URL and paste it into the plugin settings.
4. **Subscribe**: Once configured, copy the generated **Subscription URL** from the settings page and add it to your calendar app (Google Calendar -> Add by URL, or Apple Calendar -> New Subscription).

---

## 🛡️ Privacy & Security
Your data never leaves your control. The plugin only scans your local vault. If you use the Gist sync feature, your data is pushed only to your own GitHub account.

---

## 📄 Attribution & Credits
This is an enhanced "Pro" version of the original [obsidian-ical-plugin](https://github.com/andrewbrereton/obsidian-ical-plugin) by Andrew Brereton. It has been re-architected for performance, standard compliance, and rich-text support by [liuh886](https://github.com/liuh886).

Licensed under [MIT](./LICENSE).
