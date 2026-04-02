import { App, PluginSettingTab, Setting, normalizePath, setIcon } from "obsidian";
import ObsidianIcalPlugin from "./ObsidianIcalPlugin";

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

		// --- Live URL Card (The "Status" Area) ---
		const statusCard = containerEl.createDiv({ cls: "ical-pro-status-card" });
		const statusTitle = statusCard.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Your Subscription URL" });
		
		const urlContainer = statusCard.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		// --- Section: General ---
		this.addHeader(containerEl, "settings", "General Settings");

		new Setting(containerEl)
			.setName("Target directory")
			.setDesc("The folder where tasks will be scanned. Choose '/' for the entire vault.")
			.addText((text) =>
				text
					.setPlaceholder("e.g., 100_Logs/daily")
					.setValue(this.plugin.settings.rootPath)
					.onChange(async (value) => {
						this.plugin.settings.rootPath = normalizePath(value);
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("File name")
			.setDesc("The name of your generated .ics file.")
			.addText((text) =>
				text
					.setPlaceholder("obsidian.ics")
					.setValue(this.plugin.settings.filename)
					.onChange(async (value) => {
						this.plugin.settings.filename = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		// --- Section: GitHub Sync ---
		this.addHeader(containerEl, "cloud", "GitHub Sync Configuration");
		
		const githubInfo = containerEl.createDiv({ cls: "ical-pro-info-box" });
		setIcon(githubInfo, "info");
		const infoText = githubInfo.createDiv();
		infoText.createSpan({ text: "Sync your calendar online using " });
		infoText.createEl("a", { text: "GitHub Gist", href: "https://gist.github.com/" });
		infoText.createSpan({ text: ". Requires a " });
		infoText.createEl("a", { text: "Personal Access Token", href: "https://github.com/settings/tokens?type=beta" });
		infoText.createSpan({ text: " with 'Gist' scope." });

		new Setting(containerEl)
			.setName("GitHub Username")
			.addText((text) =>
				text
					.setPlaceholder("liuh886")
					.setValue(this.plugin.settings.githubUsername)
					.onChange(async (value) => {
						this.plugin.settings.githubUsername = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Personal Access Token")
			.setDesc("Used to upload your .ics to GitHub.")
			.addText((text) =>
				text
					.setPlaceholder("ghp_...")
					.setValue(this.plugin.settings.githubPersonalAccessToken)
					.onChange(async (value) => {
						this.plugin.settings.githubPersonalAccessToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.setDesc("The ID of the Gist where your file will be saved.")
			.addText((text) =>
				text
					.setPlaceholder("f4faaf35...")
					.setValue(this.plugin.settings.githubGistId)
					.onChange(async (value) => {
						this.plugin.settings.githubGistId = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		// --- Section: Rules ---
		this.addHeader(containerEl, "list-checks", "Task & Date Rules");

		new Setting(containerEl)
			.setName("Ignore completed tasks")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreCompletedTasks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreCompletedTasks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Processing multiple dates")
			.setDesc("Priority when a task has multiple dates.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("PreferDueDate", "Prefer Due Date")
					.addOption("PreferStartDate", "Prefer Start Date")
					.addOption("CreateMultipleEvents", "Create Multiple Events")
					.setValue(this.plugin.settings.howToProcessMultipleDates)
					.onChange(async (value) => {
						this.plugin.settings.howToProcessMultipleDates = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Save Interval (Minutes)")
			.setDesc("How often to sync in the background.")
			.addSlider((slider) =>
				slider
					.setLimits(5, 60, 5)
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
				text: "Complete GitHub Sync configuration to generate your URL.",
				cls: "ical-url-placeholder"
			});
		}
	}
}
