import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import ObsidianIcalPlugin from "./ObsidianIcalPlugin";
import { DEFAULT_SETTINGS } from "./Model/Settings";

export class SettingsTab extends PluginSettingTab {
	plugin: ObsidianIcalPlugin;

	constructor(app: App, plugin: ObsidianIcalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "iCal Pro Settings" });

		// --- Group: General ---
		new Setting(containerEl)
			.setName("Target directory")
			.setDesc("The folder where tasks will be scanned. Use '/' for the entire vault.")
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
					.setPlaceholder("obsidian")
					.setValue(this.plugin.settings.filename)
					.onChange(async (value) => {
						this.plugin.settings.filename = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		// --- Group: GitHub Sync ---
		containerEl.createEl("h3", { text: "GitHub Sync Configuration" });
		
		const githubDesc = containerEl.createEl("div", { cls: "setting-item-description" });
		githubDesc.appendText("To sync your calendar online, you need a ");
		githubDesc.createEl("a", { 
			text: "GitHub Personal Access Token", 
			href: "https://github.com/settings/tokens?type=beta" 
		});
		githubDesc.appendText(" (with Gist permissions) and your ");
		githubDesc.createEl("a", { 
			text: "Gist ID", 
			href: "https://gist.github.com/" 
		});
		githubDesc.appendText(".");

		new Setting(containerEl)
			.setName("Personal Access Token")
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
			.addText((text) =>
				text
					.setPlaceholder("Paste your Gist ID here")
					.setValue(this.plugin.settings.githubGistId)
					.onChange(async (value) => {
						this.plugin.settings.githubGistId = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		// --- Group: Advanced ---
		containerEl.createEl("h3", { text: "Task & Date Rules" });

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

		// --- Live URL Display ---
		containerEl.createEl("h3", { text: "Your Subscription URL" });
		const urlContainer = containerEl.createEl("div", { cls: "ical-url-container" });
		this.renderUrl(urlContainer);
	}

	private updateUrlDisplay() {
		const container = this.containerEl.querySelector(".ical-url-container");
		if (container) {
			container.empty();
			this.renderUrl(container as HTMLElement);
		}
	}

	private renderUrl(container: HTMLElement) {
		const gistId = this.plugin.settings.githubGistId;
		const filename = this.plugin.settings.filename || "obsidian";
		
		if (gistId) {
			const url = `https://gist.githubusercontent.com/raw/${gistId}/${filename}.ics`;
			container.createEl("code", { text: url, cls: "ical-url-text" });
			
			const copyBtn = container.createEl("button", { text: "Copy URL", cls: "mod-cta" });
			copyBtn.onClickEvent(() => {
				navigator.clipboard.writeText(url);
				copyBtn.setText("Copied!");
				setTimeout(() => copyBtn.setText("Copy URL"), 2000);
			});
		} else {
			container.createEl("p", { 
				text: "Configure your Gist ID above to generate a subscription URL.",
				cls: "setting-item-description"
			});
		}
	}
}
