import { Plugin, Notice, TFile, requestUrl } from "obsidian";
import { Settings, DEFAULT_SETTINGS } from "./Model/Settings";
import { SettingsManager } from "./SettingsManager";
import { IcalService } from "./Service/IcalService";
import { FileClient } from "./FileClient";
import { GistClient } from "./GistClient";
import { TaskIndex } from "./Service/TaskIndex";
import { TaskFinder } from "./Service/TaskFinder";
import { logger } from "./Logger";
import { SettingsTab } from "./SettingsTab";

export default class ObsidianIcalPlugin extends Plugin {
	settings: Settings;
	settingsManager: SettingsManager;
	icalService: IcalService;
	fileClient: FileClient;
	gistClient: GistClient;
	taskIndex: TaskIndex;
	taskFinder: TaskFinder;
	lastSyncStatus: string = "Never synced";
	lastSyncTime: string = "-";

	async onload() {
		console.log("Loading Obsidian iCal Plugin Pro");

		await this.loadSettings();

		this.taskIndex = new TaskIndex();
		this.taskFinder = new TaskFinder(this.app.vault);
		this.icalService = new IcalService();
		this.fileClient = new FileClient(this.app.vault);
		this.gistClient = new GistClient(this.settings);

		// Initialize Task Index
		await this.buildIndex();

		// Register Vault Events
		this.registerEvent(this.app.vault.on("modify", (file) => this.updateFileInIndex(file)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.removeFileFromIndex(file)));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.renameFileInIndex(file, oldPath)));

		// Add Ribbon Icon
		this.addRibbonIcon("calendar-with-checkmark", "iCal Pro: Sync Now", async () => {
			new Notice("iCal Pro: Starting synchronization...");
			try {
				await this.saveCalendar();
				new Notice("iCal Pro: Sync completed successfully!");
			} catch (error) {
				new Notice("iCal Pro: Sync failed.");
				console.error(error);
			}
		});

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Command: Save calendar
		this.addCommand({
			id: "save-calendar",
			name: "Save and Sync calendar",
			callback: async () => {
				new Notice("iCal Pro: Syncing...");
				await this.saveCalendar();
				new Notice("iCal Pro: Sync done.");
			},
		});

		// Command: Open Gist URL
		this.addCommand({
			id: "open-gist-url",
			name: "Open Gist URL in browser",
			callback: () => {
				const { githubUsername, githubGistId, filename } = this.settings;
				if (githubUsername && githubGistId) {
					const url = `https://gist.github.com/${githubUsername}/${githubGistId}`;
					window.open(url, "_blank");
				} else {
					new Notice("GitHub Sync not fully configured.");
				}
			},
		});

		// Register periodic save
		if (this.settings.isPeriodicSaveEnabled) {
			this.registerInterval(
				window.setInterval(
					() => this.saveCalendar(),
					this.settings.periodicSaveInterval * 60 * 1000
				)
			);
		}
	}

	async buildIndex() {
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			await this.updateFileInIndex(file);
		}
	}

	async updateFileInIndex(file: any) {
		if (!(file instanceof TFile)) return;
		if (this.settings.rootPath !== "/" && !file.path.startsWith(this.settings.rootPath)) {
			this.taskIndex.removeFile(file.path);
			return;
		}
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache && cache.listItems) {
			const tasks = await this.taskFinder.findTasks(file, cache.listItems, null, this.settings);
			this.taskIndex.setTasks(file.path, tasks);
		}
	}

	removeFileFromIndex(file: any) {
		if (file instanceof TFile) {
			this.taskIndex.removeFile(file.path);
		}
	}

	async renameFileInIndex(file: any, oldPath: string) {
		this.taskIndex.removeFile(oldPath);
		await this.updateFileInIndex(file);
	}

	async saveCalendar() {
		try {
			const allTasks = this.taskIndex.getAllTasks();
			const calendar = this.icalService.getCalendar(allTasks, this.settings);
			
			// Save locally
			await this.fileClient.save(calendar);
			
			// Save to Gist
			await this.gistClient.save(calendar);

			this.lastSyncStatus = "Success";
			this.lastSyncTime = new Date().toLocaleTimeString();
		} catch (e) {
			this.lastSyncStatus = "Failed";
			this.lastSyncTime = new Date().toLocaleTimeString();
			throw e;
		}
	}

	async validateConnection(): Promise<{success: boolean, message: string}> {
		const { githubPersonalAccessToken, githubGistId } = this.settings;
		if (!githubPersonalAccessToken || !githubGistId) {
			return { success: false, message: "Token or Gist ID missing." };
		}

		try {
			const response = await requestUrl({
				url: `https://api.github.com/gists/${githubGistId}`,
				method: "GET",
				headers: {
					"Authorization": `token ${githubPersonalAccessToken}`,
					"Accept": "application/vnd.github.v3+json"
				}
			});
			
			if (response.status === 200) {
				return { success: true, message: "Connection successful! Gist found." };
			} else {
				return { success: false, message: `GitHub returned status ${response.status}` };
			}
		} catch (e) {
			return { success: false, message: "Network error or invalid Token/Gist ID." };
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
