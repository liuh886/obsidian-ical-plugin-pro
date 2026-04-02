import { Task } from "../Model/Task";
import { Settings } from "../Settings";
import { ICalBuilder } from "./ICalBuilder";

export class IcalService {
	public getCalendar(tasks: Task[], settings: Settings): string {
		const builder = new ICalBuilder();
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		builder
			.setCalendarName("Obsidian Calendar")
			.setTimezone(timezone)
			.setLastUpdated(new Date())
			.setRefreshInterval(settings.periodicSaveInterval || 15);

		const includeEvents = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "EventsOnly";
		const includeTodos = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "TodosOnly";

		if (includeEvents) {
			this.addEventsToBuilder(tasks, settings, builder);
		}

		if (includeTodos) {
			this.addToDosToBuilder(tasks, settings, builder);
		}

		return builder.build();
	}

	private addEventsToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder): void {
		tasks.forEach((task) => {
			this.addEventToBuilder(task, null, "", settings, builder);
		});
	}

	private addEventToBuilder(task: Task, date: string | null, prependSummary: string, settings: Settings, builder: ICalBuilder): void {
		if (task.hasAnyDate() === false) {
			return;
		}

		// Handle multiple dates logic (similar to original, but using builder)
		if (date === null) {
			switch (settings.howToProcessMultipleDates) {
				case "PreferStartDate":
					builder.beginEvent();
					this.addEventCoreProperties(task, builder);
					if (task.hasA("Start")) {
						builder.addEventProperty("DTSTART", task.getDate("Start", "YYYYMMDD"), false);
					} else if (task.hasA("Due")) {
						builder.addEventProperty("DTSTART", task.getDate("Due", "YYYYMMDD"), false);
					} else if (task.hasA("TimeStart") && task.hasA("TimeEnd")) {
						builder.addEventProperty("DTSTART", task.getDate("TimeStart", "YYYYMMDD[T]HHmmss"), false);
						builder.addEventProperty("DTEND", task.getDate("TimeEnd", "YYYYMMDD[T]HHmmss"), false);
					} else {
						builder.addEventProperty("DTSTART", task.getDate(null, "YYYYMMDD"), false);
					}
					this.addEventCommonProperties(task, prependSummary, builder);
					builder.endEvent();
					break;

				case "CreateMultipleEvents":
					if (task.hasA("Start")) {
						builder.beginEvent();
						this.addEventCoreProperties(task, builder);
						builder.addEventProperty("DTSTART", task.getDate("Start", "YYYYMMDD"), false);
						this.addEventCommonProperties(task, "🛫 ", builder);
						builder.endEvent();
					}
					if (task.hasA("Scheduled")) {
						builder.beginEvent();
						this.addEventCoreProperties(task, builder);
						builder.addEventProperty("DTSTART", task.getDate("Scheduled", "YYYYMMDD"), false);
						this.addEventCommonProperties(task, "⏳ ", builder);
						builder.endEvent();
					}
					if (task.hasA("Due")) {
						builder.beginEvent();
						this.addEventCoreProperties(task, builder);
						builder.addEventProperty("DTSTART", task.getDate("Due", "YYYYMMDD"), false);
						this.addEventCommonProperties(task, "📅 ", builder);
						builder.endEvent();
					}
					if (!task.hasA("Start") && !task.hasA("Scheduled") && !task.hasA("Due")) {
						builder.beginEvent();
						this.addEventCoreProperties(task, builder);
						builder.addEventProperty("DTSTART", task.getDate(null, "YYYYMMDD"), false);
						this.addEventCommonProperties(task, "", builder);
						builder.endEvent();
					}
					break;

				case "PreferDueDate":
				default:
					builder.beginEvent();
					this.addEventCoreProperties(task, builder);
					if (task.hasA("Start") && task.hasA("Due")) {
						builder.addEventProperty("DTSTART", task.getDate("Start", "YYYYMMDDTHHmmss"), false);
						builder.addEventProperty("DTEND", task.getDate("Due", "YYYYMMDDTHHmmss"), false);
					} else if (task.hasA("Due")) {
						builder.addEventProperty("DTSTART", task.getDate("Due", "YYYYMMDD"), false);
					} else if (task.hasA("Start")) {
						builder.addEventProperty("DTSTART", task.getDate("Start", "YYYYMMDD"), false);
					} else if (task.hasA("TimeStart") && task.hasA("TimeEnd")) {
						builder.addEventProperty("DTSTART", task.getDate("TimeStart", "YYYYMMDD[T]HHmmss"), false);
						builder.addEventProperty("DTEND", task.getDate("TimeEnd", "YYYYMMDD[T]HHmmss"), false);
					} else {
						builder.addEventProperty("DTSTART", task.getDate(null, "YYYYMMDD"), false);
					}
					this.addEventCommonProperties(task, prependSummary, builder);
					builder.endEvent();
					break;
			}
		} else {
			builder.beginEvent();
			this.addEventCoreProperties(task, builder);
			builder.addEventProperty("DTSTART", date, false);
			this.addEventCommonProperties(task, prependSummary, builder);
			builder.endEvent();
		}
	}

	private addEventCoreProperties(task: Task, builder: ICalBuilder): void {
		builder.addEventProperty("UID", task.getId(), false);
		builder.addEventProperty("DTSTAMP", task.getDate(null, "YYYYMMDDTHHmmss"), false);
	}

	private addEventCommonProperties(task: Task, prependSummary: string, builder: ICalBuilder): void {
		builder.addEventProperty("SUMMARY", prependSummary + task.getSummary());
		
		const body = task.getBody();
		if (body) {
			builder.addEventProperty("DESCRIPTION", body);
		}
		
		builder.addEventProperty("LOCATION", task.getLocation());
	}

	private addToDosToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder): void {
		tasks.forEach((task) => {
			if (settings.isOnlyTasksWithoutDatesAreTodos && task.hasAnyDate()) {
				return;
			}
			
			builder.beginToDo();
			builder.addEventProperty("UID", task.getId(), false);
			builder.addEventProperty("SUMMARY", task.getSummary());
			
			if (task.hasAnyDate()) {
				builder.addEventProperty("DTSTAMP", task.getDate(null, "YYYYMMDDTHHmmss"), false);
			}

			const body = task.getBody();
			if (body) {
				builder.addEventProperty("DESCRIPTION", body);
			}

			builder.addEventProperty("LOCATION", task.getLocation());

			if (task.hasA("Due")) {
				builder.addEventProperty("DUE;VALUE=DATE", task.getDate("Due", "YYYYMMDD"), false);
			}

			builder.endToDo();
		});
	}
}
