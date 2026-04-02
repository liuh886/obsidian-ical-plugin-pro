import { Plugin } from "obsidian";
import { Settings, DEFAULT_SETTINGS } from "./Model/Settings";
import { SettingsManager } from "./SettingsManager";
import { IcalService } from "./Service/IcalService";
import { FileClient } from "./FileClient";
import { logger } from "./Logger";
import { SettingsTab } from "./SettingsTab";

export default class ObsidianIcalPlugin extends Plugin {
	settings: Settings;
	settingsManager: SettingsManager;
	icalService: IcalService;
	fileClient: FileClient;

	async onload() {
		console.log("Loading Obsidian iCal Plugin Pro");

		await this.loadSettings();

		this.settingsManager = await SettingsManager.createInstance(this);
		this.icalService = new IcalService();
		this.fileClient = new FileClient(this.app.vault);

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Register periodic save if enabled
		if (this.settings.isPeriodicSaveEnabled) {
			this.registerInterval(
				window.setInterval(
					() => this.saveCalendar(),
					this.settings.periodicSaveInterval * 60 * 1000
				)
			);
		}

		// Add command to manually save calendar
		this.addCommand({
			id: "save-calendar",
			name: "Save calendar",
			callback: () => {
				this.saveCalendar();
			},
		});
	}

	onunload() {
		console.log("Unloading Obsidian iCal Plugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async saveCalendar() {
		// Implementation for saving calendar
		// This usually involves finding tasks, building the iCal string, and saving it via fileClient
		logger(this.settings.isDebug).log("Saving calendar...");
		// const tasks = await taskFinder.findTasks();
		// const calendar = this.icalService.getCalendar(tasks, this.settings);
		// await this.fileClient.save(calendar);
	}
}
