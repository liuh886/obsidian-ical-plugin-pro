import { Settings } from "../Model/Settings";
import { Task } from "../Model/Task";
import { IcalService } from "../Service/IcalService";
import { CalendarDestination } from "../Infrastructure/CalendarDestination";
import { SyncExecutionError } from "./SyncExecutionError";
import { SyncPreview, SyncPreviewService } from "./SyncPreviewService";
import { TaskIndexStats } from "./TaskIndexingService";
import { ErrorHelper } from "../Service/ErrorHelper";

export interface DestinationSyncResult {
	name: string;
	status: "success" | "failed";
	message: string;
}

export interface SyncResult {
	taskCount: number;
	destinations: string[];
	destinationResults: DestinationSyncResult[];
	preview: SyncPreview;
	calendarSize: number;
	eventCount: number;
	todoCount: number;
}

export class CalendarSyncService {
	private readonly previewService: SyncPreviewService;

	constructor(
		private readonly icalService: IcalService,
		private readonly destinations: CalendarDestination[],
	) {
		this.previewService = new SyncPreviewService(icalService);
	}

	public async sync(tasks: Task[], indexStats: TaskIndexStats, settings: Settings): Promise<SyncResult> {
		const enabledDestinations = this.destinations.filter((destination) => destination.isEnabled(settings));
		if (enabledDestinations.length === 0) {
			throw new Error("No save destination enabled. Configure local save or GitHub Gist sync first.");
		}

		const calendar = this.icalService.getCalendar(tasks, settings);
		const preview = this.previewService.build(tasks, indexStats, settings);
		const destinationResults: DestinationSyncResult[] = [];

		for (const destination of enabledDestinations) {
			try {
				await destination.save(calendar, settings);
				destinationResults.push({
					name: destination.name,
					status: "success",
					message: "Saved successfully",
				});
			} catch (error) {
				destinationResults.push({
					name: destination.name,
					status: "failed",
					message: ErrorHelper.get(error),
				});
			}
		}

		const result: SyncResult = {
			taskCount: tasks.length,
			destinations: enabledDestinations.map((destination) => destination.name),
			destinationResults,
			preview,
			calendarSize: calendar.length,
			eventCount: preview.eventCount,
			todoCount: preview.todoCount,
		};

		if (destinationResults.some((entry) => entry.status === "failed")) {
			throw new SyncExecutionError("One or more destinations failed during sync.", result);
		}

		return result;
	}
}
