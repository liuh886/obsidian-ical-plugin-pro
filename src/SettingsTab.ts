import { App, PluginSettingTab, Setting, normalizePath, setIcon, Notice } from "obsidian";
import ObsidianIcalPlugin from "./ObsidianIcalPlugin";
import { FolderSuggest } from "./FolderSuggest";
import { HOW_TO_PARSE_INTERNAL_LINKS, HOW_TO_PROCESS_MULTIPLE_DATES } from "./Model/Settings";

export class SettingsTab extends PluginSettingTab {
	plugin: ObsidianIcalPlugin;

	constructor(app: App, plugin: ObsidianIcalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Header ---
		const header = containerEl.createDiv({ cls: "ical-pro-header" });
		const headerText = header.createDiv({ cls: "ical-pro-header-title" });
		headerText.createEl("h2", { text: "iCal Pro" });
		headerText.createEl("span", { text: "v" + this.plugin.manifest.version, cls: "ical-pro-version" });

		// --- Live Status Card ---
		const statusCard = containerEl.createDiv({ cls: "ical-pro-status-card" });
		const statusGrid = statusCard.createDiv({ cls: "ical-pro-status-grid" });
		
		const urlCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const statusTitle = urlCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Subscription URL" });
		const urlContainer = urlCol.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		const syncCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const syncTitle = syncCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(syncTitle, "refresh-cw");
		syncTitle.createSpan({ text: " Sync Status" });
		const syncInfo = syncCol.createDiv({ cls: "ical-sync-info" });
		syncInfo.createEl("div", { text: `Last Result: ${this.plugin.lastSyncStatus}`, cls: `ical-status-${this.plugin.lastSyncStatus.toLowerCase()}` });
		syncInfo.createEl("div", { text: `At: ${this.plugin.lastSyncTime}`, cls: "ical-sync-time" });
		
		const syncBtn = syncCol.createEl("button", { text: "Sync Now", cls: "mod-cta ical-sync-button" });
		syncBtn.onClickEvent(async () => {
			syncBtn.setDisabled(true);
			syncBtn.setText("Syncing...");
			try {
				await this.plugin.saveCalendar();
				new Notice("iCal Pro: Sync successful!");
				this.display(); // Refresh to show new time
			} catch (e) {
				new Notice("iCal Pro: Sync failed.");
				this.display();
			}
		});

		// --- SECTION 1: TASK SOURCES ---
		this.addHeader(containerEl, "search", "1. Task Sources");
		
		new Setting(containerEl)
			.setName("Target Directory")
			.setDesc("The plugin will only scan files inside this folder. Type to search.")
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setPlaceholder("Search folder...")
					.setValue(this.plugin.settings.rootPath)
					.onChange(async (value) => {
						this.plugin.settings.rootPath = normalizePath(value);
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					});
			});

		// --- SECTION 2: DATE LOGIC ---
		this.addHeader(containerEl, "calendar-days", "2. Date & Time Logic");

		new Setting(containerEl)
			.setName("Day Planner Mode")
			.setDesc("Enable this if you use Day Planner style (Heading = Date, Line = Time).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isDayPlannerPluginFormatEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		const tip = containerEl.createEl("p", { cls: "ical-pro-logic-tip" });
		if (this.plugin.settings.isDayPlannerPluginFormatEnabled) {
			tip.setText("💡 Mode: Date inherited from Heading (## 2026-04-02).");
		} else {
			tip.setText("💡 Mode: Standard Emoji-based (📅 2026-04-02).");
		}

		// --- SECTION 3: GITHUB SYNC ---
		this.addHeader(containerEl, "cloud", "3. GitHub Sync Configuration");

		new Setting(containerEl)
			.setName("GitHub Username")
			.setDesc("Your GitHub account name (required for URL).")
			.addText((text) =>
				text.setValue(this.plugin.settings.githubUsername)
					.onChange(async (value) => {
						this.plugin.settings.githubUsername = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.setDesc("Create a Gist at gist.github.com and paste its ID here.")
			.addText((text) =>
				text.setValue(this.plugin.settings.githubGistId)
					.onChange(async (value) => {
						this.plugin.settings.githubGistId = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Personal Access Token")
			.setDesc("Create a Token (Gist scope) at GitHub Settings -> Developer Settings.")
			.addText((text) =>
				text.setPlaceholder("ghp_...")
					.setValue(this.plugin.settings.githubPersonalAccessToken)
					.onChange(async (value) => {
						this.plugin.settings.githubPersonalAccessToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Gist Filename")
			.setDesc("The name of the file inside the Gist (default: obsidian.ics).")
			.addText((text) =>
				text.setPlaceholder("obsidian.ics")
					.setValue(this.plugin.settings.filename)
					.onChange(async (value) => {
						this.plugin.settings.filename = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		const setupLinks = containerEl.createDiv({ cls: "ical-pro-info-box" });
		setIcon(setupLinks, "help-circle");
		const linksText = setupLinks.createDiv();
		linksText.createSpan({ text: "Setup Guides: " });
		linksText.createEl("a", { text: "Create Token", href: "https://github.com/settings/tokens?type=beta" });
		linksText.createSpan({ text: " | " });
		linksText.createEl("a", { text: "Manage Gists", href: "https://gist.github.com/" });

		new Setting(containerEl)
			.setName("Verify Connection")
			.addButton((btn) => 
				btn.setButtonText("Test GitHub Sync")
					.onClick(async () => {
						btn.setDisabled(true);
						const result = await this.plugin.validateConnection();
						new Notice(result.success ? "✅ " + result.message : "❌ " + result.message);
						btn.setDisabled(false);
					})
			);

		// --- SECTION 4: ALARMS & REMINDERS ---
		this.addHeader(containerEl, "bell", "4. Alarms & Reminders");

		new Setting(containerEl)
			.setName("Enable Calendar Alarms")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAlarms)
					.onChange(async (value) => {
						this.plugin.settings.enableAlarms = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default Alarm Offset")
			.setDesc("Minutes before the event.")
			.addText((text) =>
				text
					.setPlaceholder("20")
					.setValue(String(this.plugin.settings.defaultAlarmOffset))
					.onChange(async (value) => {
						this.plugin.settings.defaultAlarmOffset = parseInt(value) || 20;
						await this.plugin.saveSettings();
					})
			);

		// --- SECTION 5: ADVANCED ---
		this.addHeader(containerEl, "sliders", "5. Advanced Rules");

		new Setting(containerEl)
			.setName("Ignore Completed Tasks")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreCompletedTasks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreCompletedTasks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Filter by Age (Ignore Old Tasks)")
			.setDesc("Ignore tasks older than X days. Disable to include all past tasks.")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.ignoreOldTasks)
				.onChange(async (value) => {
					this.plugin.settings.ignoreOldTasks = value;
					await this.plugin.saveSettings();
					this.display();
				}))
			.addText((text) => text
				.setPlaceholder("365")
				.setValue(String(this.plugin.settings.oldTaskInDays))
				.onChange(async (value) => {
					this.plugin.settings.oldTaskInDays = parseInt(value) || 365;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Sync Interval (Minutes)")
			.addSlider((slider) =>
				slider.setLimits(5, 120, 5)
					.setValue(this.plugin.settings.periodicSaveInterval)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.periodicSaveInterval = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private addHeader(el: HTMLElement, icon: string, text: string) {
		const header = el.createDiv({ cls: "ical-pro-section-header" });
		const iconEl = header.createDiv({ cls: "ical-pro-section-icon" });
		setIcon(iconEl, icon);
		header.createEl("h3", { text: text });
	}

	private updateUrlDisplay() {
		const container = this.containerEl.querySelector(".ical-url-container");
		if (container) {
			container.empty();
			this.renderUrl(container as HTMLElement);
		}
	}

	private renderUrl(container: HTMLElement) {
		const username = this.plugin.settings.githubUsername;
		const gistId = this.plugin.settings.githubGistId;
		let filename = this.plugin.settings.filename || "obsidian.ics";
		
		if (username && gistId) {
			const url = `https://gist.githubusercontent.com/${username}/${gistId}/raw/${filename}`;
			container.createEl("code", { text: url, cls: "ical-url-text" });
			
			const copyBtn = container.createEl("button", { text: "Copy URL", cls: "mod-cta" });
			copyBtn.onClickEvent(() => {
				navigator.clipboard.writeText(url);
				copyBtn.setText("Copied!");
				setTimeout(() => copyBtn.setText("Copy URL"), 2000);
			});
		} else {
			container.createEl("p", { 
				text: "Awaiting GitHub Sync config...",
				cls: "ical-url-placeholder"
			});
		}
	}
}
