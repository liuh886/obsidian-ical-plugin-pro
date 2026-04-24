import { Notice, Plugin, TAbstractFile, TFile, requestUrl } from "obsidian";
import { CalendarSyncService } from "./Application/CalendarSyncService";
import { ConnectionValidationService } from "./Application/ConnectionValidationService";
import { DiagnosticsService } from "./Application/DiagnosticsService";
import { PluginSettingsStore, SyncHistoryEntry } from "./Application/PluginSettingsStore";
import { SyncExecutionError } from "./Application/SyncExecutionError";
import { SyncAutomationService } from "./Application/SyncAutomationService";
import { SyncPreviewService } from "./Application/SyncPreviewService";
import { SyncReadinessService } from "./Application/SyncReadinessService";
import { TaskIdentityService } from "./Application/TaskIdentityService";
import { TaskIndexingService } from "./Application/TaskIndexingService";
import { FileClient } from "./Infrastructure/FileClient";
import { GistClient } from "./Infrastructure/GistClient";
import { logger } from "./Service/Logger";
import { DEFAULT_SETTINGS, Settings, migrateSettings } from "./Model/Settings";
import { IcalService } from "./Service/IcalService";
import { TaskFinder } from "./Service/TaskFinder";
import { TaskIndex } from "./Service/TaskIndex";
import { SettingsTab } from "./UI/SettingsTab";

type UpdateSettingsOptions = {
	rebuildIndex?: boolean;
	rescheduleSync?: boolean;
};

export default class ObsidianIcalPlugin extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;
	lastSyncStatus = "Never synced";
	lastSyncTime = "-";
	lastSyncMessage = "";
	syncHistory: SyncHistoryEntry[] = [];
	private readonly pendingFileUpdates = new Map<string, TFile>();

	private readonly settingsStore = new PluginSettingsStore(this);
	private readonly syncReadinessService = new SyncReadinessService();
	private readonly connectionValidationService = new ConnectionValidationService(requestUrl);
	private readonly syncAutomationService = new SyncAutomationService(this.syncReadinessService);
	private readonly diagnosticsService = new DiagnosticsService();
	private readonly icalService = new IcalService();
	private readonly syncPreviewService = new SyncPreviewService(this.icalService);
	private readonly taskIndex = new TaskIndex();
	private taskIdentityService = new TaskIdentityService();
	private taskFinder!: TaskFinder;
	private taskIndexService!: TaskIndexingService;
	private syncService!: CalendarSyncService;
	private syncIntervalId: number | null = null;
	private fileUpdateFlushId: number | null = null;
	private settingsSaveId: number | null = null;

	async onload() {
		await this.loadSettings();
		logger(this.settings.isDebug);
		logger().log("Loading iCal Pro");
		this.taskFinder = new TaskFinder(this.app.vault);
		this.taskIndexService = new TaskIndexingService(
			this.app.vault,
			this.app.metadataCache,
			this.taskIndex,
			this.taskFinder,
			this.taskIdentityService,
		);
		this.syncService = new CalendarSyncService(this.icalService, [
			new FileClient(this.app.vault),
			new GistClient(),
		]);

		this.registerVaultEvents();
		this.registerUi();
		this.registerCommands();

		// Postpone heavy operations until Obsidian is fully loaded
		this.app.workspace.onLayoutReady(() => {
			this.runAsync(async () => {
				await this.rebuildIndex();

				this.syncIntervalId = this.syncAutomationService.configurePeriodicSync(
					this.settings,
					() => this.saveCalendar(),
					(intervalId) => this.registerInterval(intervalId),
					this.syncIntervalId,
				);

				await this.syncAutomationService.runStartupSyncIfReady(this.settings, () => this.saveCalendar());
			});
		});
	}

	public async updateSettings(patch: Partial<Settings>, options: UpdateSettingsOptions = {}): Promise<void> {
		const previousSettings = { ...this.settings };
		Object.assign(this.settings, patch);
		await this.saveSettings();

		if (options.rebuildIndex) {
			await this.rebuildIndex();
		} else {
			await this.taskIndexService.handleSettingsChange(previousSettings, this.settings);
		}

		if (options.rescheduleSync) {
			this.syncIntervalId = this.syncAutomationService.configurePeriodicSync(
				this.settings,
				() => this.saveCalendar(),
				(intervalId) => this.registerInterval(intervalId),
				this.syncIntervalId,
			);
		}
	}

	public async rebuildIndex(): Promise<void> {
		await this.taskIndexService.rebuild(this.settings);
		await this.saveSettings();
	}

	public updateFileInIndex(file: TAbstractFile): void {
		if (!(file instanceof TFile)) return;
		this.pendingFileUpdates.set(file.path, file);
		this.schedulePendingFileIndexFlush();
	}

	public removeFileFromIndex(file: TAbstractFile): void {
		if (file instanceof TFile) {
			this.pendingFileUpdates.delete(file.path);
			this.taskIndexService.removeFile(file.path);
			this.scheduleSettingsSave();
		}
	}

	public async renameFileInIndex(file: TAbstractFile, oldPath: string): Promise<void> {
		if (!(file instanceof TFile)) return;
		this.pendingFileUpdates.delete(oldPath);
		this.pendingFileUpdates.delete(file.path);
		await this.taskIndexService.renameFile(file, oldPath, this.settings);
		this.scheduleSettingsSave();
	}

	public async saveCalendar(): Promise<void> {
		const timestamp = new Date();
		try {
			await this.flushPendingFileUpdates();
			const readiness = this.syncReadinessService.evaluate(this.settings);
			if (!readiness.ready) {
				throw new Error(readiness.issues.join(" "));
			}

			const result = await this.syncService.sync(
				this.taskIndexService.getAllTasks(),
				this.taskIndexService.getIndexStats(),
				this.settings,
			);
			this.lastSyncStatus = "Success";
			this.lastSyncTime = timestamp.toLocaleTimeString();
			this.lastSyncMessage = `Synced ${result.preview.exportedTaskCount} tasks to ${result.destinations.join(", ")}`;
			this.recordSyncHistory({
				status: "success",
				timestamp: timestamp.toISOString(),
				message: this.lastSyncMessage,
				destinationResults: result.destinationResults,
			});
		} catch (error: unknown) {
			this.lastSyncTime = timestamp.toLocaleTimeString();
			if (error instanceof SyncExecutionError) {
				const hasSuccess = error.result.destinationResults.some((entry) => entry.status === "success");
				this.lastSyncStatus = hasSuccess ? "Partial" : "Failed";
				this.lastSyncMessage = error.result.destinationResults
					.map((entry) => `${entry.name}: ${entry.status}${entry.message ? ` (${entry.message})` : ""}`)
					.join("; ");
				this.recordSyncHistory({
					status: hasSuccess ? "partial" : "failed",
					timestamp: timestamp.toISOString(),
					message: this.lastSyncMessage,
					destinationResults: error.result.destinationResults,
				});
			} else {
				this.lastSyncStatus = "Failed";
				this.lastSyncMessage = this.getErrorMessage(error);
				this.recordSyncHistory({
					status: "failed",
					timestamp: timestamp.toISOString(),
					message: this.lastSyncMessage,
					destinationResults: [],
				});
			}
			console.error(`iCal Pro: sync error details: ${this.getErrorMessage(error)}`);
			throw error;
		} finally {
			await this.saveSettings();
		}
	}

	public async validateConnection(): Promise<{ success: boolean; message: string }> {
		return await this.connectionValidationService.validateGist(this.settings);
	}

	public getSyncReadiness() {
		return this.syncReadinessService.evaluate(this.settings);
	}

	public getSyncPreview() {
		return this.syncPreviewService.build(
			this.taskIndexService.getAllTasks(),
			this.taskIndexService.getIndexStats(),
			this.settings,
		);
	}

	public getDiagnosticsBundle(): string {
		return this.diagnosticsService.build({
			settings: this.settings,
			readiness: this.getSyncReadiness(),
			preview: this.getSyncPreview(),
			recentSyncResults: this.syncHistory,
		});
	}

	private registerVaultEvents(): void {
		this.registerEvent(this.app.vault.on("modify", (file) => this.updateFileInIndex(file)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.removeFileFromIndex(file)));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.renameFileInIndex(file, oldPath)));
		this.registerEvent(this.app.vault.on("create", (file) => this.updateFileInIndex(file)));
		this.registerEvent(this.app.metadataCache.on("changed", (file) => this.updateFileInIndex(file)));
	}

	private registerUi(): void {
		this.addRibbonIcon("calendar-with-checkmark", "Sync now", () => {
			this.runAsync(() => this.runSyncWithNotice("Starting sync...", "Sync completed."));
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	private registerCommands(): void {
		this.addCommand({
			id: "save-calendar",
			name: "Save and sync calendar",
			callback: () => {
				this.runAsync(() => this.runSyncWithNotice("iCal Pro: syncing...", "iCal Pro: sync done."));
			},
		});

		this.addCommand({
			id: "open-gist-url",
			name: "Open link in browser",
			callback: () => {
				const { githubUsername, githubGistId } = this.settings;
				if (!githubUsername || !githubGistId) {
					new Notice("GitHub sync not fully configured.");
					return;
				}

				window.open(`https://gist.github.com/${githubUsername}/${githubGistId}`, "_blank");
			},
		});
	}

	private async runSyncWithNotice(startMessage: string, successMessage: string): Promise<void> {
		new Notice(startMessage);
		try {
			await this.saveCalendar();
			new Notice(successMessage);
		} catch {
			new Notice(`iCal Pro: sync failed. ${this.lastSyncMessage}`);
		}
	}

	private runAsync(task: () => Promise<void>): void {
		void task();
	}

	private schedulePendingFileIndexFlush(delay = 250): void {
		if (this.fileUpdateFlushId !== null) {
			window.clearTimeout(this.fileUpdateFlushId);
		}

		this.fileUpdateFlushId = window.setTimeout(() => {
			this.fileUpdateFlushId = null;
			this.runAsync(() => this.flushPendingFileUpdates());
		}, delay);
	}

	private async flushPendingFileUpdates(): Promise<void> {
		if (this.fileUpdateFlushId !== null) {
			window.clearTimeout(this.fileUpdateFlushId);
			this.fileUpdateFlushId = null;
		}

		if (this.pendingFileUpdates.size === 0) {
			return;
		}

		const files = [...this.pendingFileUpdates.values()];
		this.pendingFileUpdates.clear();

		for (const file of files) {
			await this.taskIndexService.indexFile(file, this.settings);
		}

		await this.saveSettings();
	}

	private scheduleSettingsSave(delay = 100): void {
		if (this.settingsSaveId !== null) {
			window.clearTimeout(this.settingsSaveId);
		}

		this.settingsSaveId = window.setTimeout(() => {
			this.settingsSaveId = null;
			this.runAsync(() => this.saveSettings());
		}, delay);
	}

	private async loadSettings(): Promise<void> {
		const raw = await this.settingsStore.load();
		this.settings = migrateSettings(raw);
		this.taskIdentityService = new TaskIdentityService(this.settingsStore.loadTaskIdentityState(raw));
		this.syncHistory = this.settingsStore.loadSyncHistory(raw);
	}

	private async saveSettings(): Promise<void> {
		await this.settingsStore.save(this.settings, this.taskIndexService.getTaskIdentityState(), this.syncHistory);
		logger(this.settings.isDebug);
	}

	private recordSyncHistory(entry: SyncHistoryEntry): void {
		this.syncHistory = [entry, ...this.syncHistory].slice(0, 10);
	}

	private getErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}

		if (typeof error === "object" && error !== null) {
			try {
				return JSON.stringify(error);
			} catch {
				return "Unknown error object";
			}
		}

		if (
			typeof error === "string"
			|| typeof error === "number"
			|| typeof error === "boolean"
			|| typeof error === "bigint"
			|| typeof error === "symbol"
			|| typeof error === "undefined"
		) {
			return String(error);
		}

		return "Unknown error";
	}
}
