import { Settings } from "../Model/Settings";
import { DestinationHealthService } from "./DestinationHealthService";
import type { SyncReadiness } from "./SyncReadinessService";
import type { SyncPreview } from "./SyncPreviewService";
import type { SyncHistoryEntry } from "./PluginSettingsStore";

export interface DiagnosticsInput {
	settings: Settings;
	readiness: SyncReadiness;
	preview: SyncPreview;
	recentSyncResults: SyncHistoryEntry[];
}

export class DiagnosticsService {
	private readonly destinationHealthService = new DestinationHealthService();

	public build(input: DiagnosticsInput): string {
		const payload = {
			generatedAt: new Date().toISOString(),
			settings: this.redactSettings(input.settings),
			readiness: input.readiness,
			destinationChecks: this.destinationHealthService.evaluate(input.settings),
			preview: input.preview,
			recentSyncResults: input.recentSyncResults,
		};

		return JSON.stringify(payload, null, 2);
	}

	private redactSettings(settings: Settings) {
		return {
			...settings,
			githubPersonalAccessToken: settings.githubPersonalAccessToken ? "***redacted***" : "",
		};
	}
}
