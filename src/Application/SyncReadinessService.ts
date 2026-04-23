import { Settings } from "../Model/Settings";
import { DestinationHealthService } from "./DestinationHealthService";

export interface SyncReadiness {
	ready: boolean;
	activeDestinations: string[];
	issues: string[];
}

export class SyncReadinessService {
	private readonly destinationHealthService = new DestinationHealthService();

	public evaluate(settings: Settings): SyncReadiness {
		const report = this.destinationHealthService.evaluate(settings);

		return {
			ready: report.ready,
			activeDestinations: report.activeDestinations,
			issues: report.issues,
		};
	}
}
