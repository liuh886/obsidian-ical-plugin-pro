import { Settings } from "../Model/Settings";
import { SyncReadinessService } from "./SyncReadinessService";

type SyncFn = () => Promise<void>;
type RegisterIntervalFn = (intervalId: number) => void;

export class SyncAutomationService {
	constructor(private readonly readinessService: SyncReadinessService) {}

	public configurePeriodicSync(
		settings: Settings,
		runSync: SyncFn,
		registerInterval: RegisterIntervalFn,
		currentIntervalId: number | null,
	): number | null {
		if (currentIntervalId !== null) {
			window.clearInterval(currentIntervalId);
		}

		if (!settings.isPeriodicSaveEnabled) {
			return null;
		}

		const intervalId = window.setInterval(() => {
			void runSync().catch((error) => {
				console.error(`iCal Pro: periodic sync failed: ${this.getErrorMessage(error)}`);
			});
		}, settings.periodicSaveInterval * 60 * 1000);

		registerInterval(intervalId);
		return intervalId;
	}

	public async runStartupSyncIfReady(settings: Settings, runSync: SyncFn): Promise<void> {
		if (!this.readinessService.evaluate(settings).ready) {
			return;
		}

		try {
			await runSync();
		} catch (error) {
			console.error(`iCal Pro: startup sync failed: ${this.getErrorMessage(error)}`);
		}
	}

	private getErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
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
