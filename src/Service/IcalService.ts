import { Task } from "../Model/Task";
import { Settings } from "../Model/Settings";
import { TaskStatus } from "../Model/TaskStatus";
import { ICalBuilder } from "./ICalBuilder";

export interface CalendarProjection {
	exportedTaskCount: number;
	eventCount: number;
	todoCount: number;
	todoReasons: Array<{ reason: string; count: number }>;
}

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
		const projection = this.getTaskBuckets(tasks, settings);
		const {
			exportableTasks,
			datedTasks,
			timedTasks,
			untimedTasks,
			floatingTasks,
		} = projection;

		if (includeEvents) {
			const eventTasks = settings.includeEventsOrTodos === "EventsAndTodos" ? timedTasks : datedTasks;
			this.addEventsToBuilder(eventTasks, settings, builder, timezone);
		}

		if (includeTodos) {
			const todoTasks = settings.includeEventsOrTodos === "EventsAndTodos"
				? [...untimedTasks, ...floatingTasks]
				: (settings.isOnlyTasksWithoutDatesAreTodos ? floatingTasks : exportableTasks);
			this.addToDosToBuilder(todoTasks, settings, builder);
		}

		return builder.build();
	}

	public getProjection(tasks: Task[], settings: Settings): CalendarProjection {
		const projection = this.getTaskBuckets(tasks, settings);
		return {
			exportedTaskCount: projection.exportableTasks.length,
			eventCount: projection.eventCount,
			todoCount: projection.todoCount,
			todoReasons: projection.todoReasons,
		};
	}

	private addEventsToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder, timezone: string): void {
		tasks.forEach((task) => {
			this.addEventToBuilder(task, null, "", settings, builder, timezone);
		});
	}

	private addEventToBuilder(task: Task, dateStr: string | null, prependSummary: string, settings: Settings, builder: ICalBuilder, timezone: string): void {
		if (dateStr === null) {
			switch (settings.howToProcessMultipleDates) {
				case "PreferStartDate":
					this.processSingleEvent(task, task.hasA("Start") ? "Start" : "Due", prependSummary, settings, builder, timezone);
					break;
				case "CreateMultipleEvents":
					if (task.hasA("Start")) this.processSingleEvent(task, "Start", "🛫 ", settings, builder, timezone);
					if (task.hasA("Scheduled")) this.processSingleEvent(task, "Scheduled", "⏳ ", settings, builder, timezone);
					if (task.hasA("Due")) this.processSingleEvent(task, "Due", "📅 ", settings, builder, timezone);
					break;
				default:
					this.processSingleEvent(task, task.hasA("Due") ? "Due" : "Start", prependSummary, settings, builder, timezone);
					break;
			}
		} else {
			this.renderEvent(task, dateStr, true, prependSummary, settings, builder, timezone);
		}
	}

	private processSingleEvent(task: Task, dateName: string, prepend: string, settings: Settings, builder: ICalBuilder, timezone: string) {
		const rawDate = task.getRawDate(dateName);
		if (!rawDate) return;

		const hasTime = rawDate.getHours() !== 0 || rawDate.getMinutes() !== 0;
		const format = hasTime ? "YYYYMMDD[T]HHmmss" : "YYYYMMDD";
		const dateStr = task.getDate(dateName, format);
		
		this.renderEvent(task, dateStr, hasTime, prepend, settings, builder, timezone);
	}

	private renderEvent(task: Task, dateValue: string, hasTime: boolean, prepend: string, settings: Settings, builder: ICalBuilder, timezone: string) {
		builder.beginEvent();
		builder.addEventProperty("UID", task.getId(), false);
		builder.addEventProperty("DTSTAMP", this.getUtcTimestamp(), false);
		
		const dateKey = hasTime ? `DTSTART;TZID=${timezone}` : "DTSTART;VALUE=DATE";
		builder.addEventProperty(dateKey, dateValue, false);
		
		builder.addEventProperty("SUMMARY", this.getSummary(task, prepend));
		if (task.getPriority() !== null) builder.addEventProperty("PRIORITY", String(task.getPriority()), false);
		const rrule = task.getRecurrenceRule();
		if (rrule) builder.addEventProperty("RRULE", rrule, false);
		if (task.getCategories().length > 0) builder.addEventProperty("CATEGORIES", task.getCategories().join(","), false);
		if (task.status === TaskStatus.Cancelled) builder.addEventProperty("STATUS", "CANCELLED", false);
		const description = this.getDescription(task, settings);
		if (description) builder.addEventProperty("DESCRIPTION", description);
		if (this.shouldIncludeLocation(settings)) builder.addEventProperty("LOCATION", task.getLocation());
		const duration = task.getDurationMinutes();
		if (hasTime && duration) {
			const endDate = this.addMinutes(task.getRawDate("Due") ?? task.getRawDate("Start"), duration);
			if (endDate) builder.addEventProperty(`DTEND;TZID=${timezone}`, this.formatDateTime(endDate), false);
		}

		if (settings.enableAlarms && task.alarmOffset !== null) {
			builder.addAlarm(task.alarmOffset, this.getSummary(task));
		}
		builder.endEvent();
	}

	private addToDosToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder): void {
		tasks.forEach((task) => {
			builder.beginToDo();
			builder.addEventProperty("UID", task.getId(), false);
			builder.addEventProperty("SUMMARY", this.getSummary(task));
			if (task.getPriority() !== null) builder.addEventProperty("PRIORITY", String(task.getPriority()), false);
			const rrule = task.getRecurrenceRule();
			if (rrule) builder.addEventProperty("RRULE", rrule, false);
			if (task.getCategories().length > 0) builder.addEventProperty("CATEGORIES", task.getCategories().join(","), false);
			const status = this.getTodoStatus(task);
			if (status) builder.addEventProperty("STATUS", status, false);
			
			if (task.hasAnyDate()) {
				builder.addEventProperty("DTSTAMP", this.getUtcTimestamp(), false);
				if (task.hasA("Due")) {
					const hasTime = task.hasTimedDate();
					const format = hasTime ? "YYYYMMDD[T]HHmmss" : "YYYYMMDD";
					const dateValue = task.getDate("Due", format);
					const dateKey = hasTime ? "DUE" : "DUE;VALUE=DATE";
					builder.addEventProperty(dateKey, dateValue, false);
				}
			}
			const completedAt = task.getCompletedAt();
			if (task.status === TaskStatus.Done && completedAt) {
				builder.addEventProperty("COMPLETED", this.formatUtcDateTime(completedAt), false);
			}

			const description = this.getDescription(task, settings);
			if (description) builder.addEventProperty("DESCRIPTION", description);
			if (this.shouldIncludeLocation(settings)) builder.addEventProperty("LOCATION", task.getLocation());
			builder.endToDo();
		});
	}

	private getSummary(task: Task, prepend = ""): string {
		return this.cleanSummary(`${prepend}${task.getSummary()}`);
	}

	private getDescription(task: Task, settings: Settings): string {
		const parts: string[] = [];
		const body = this.cleanDescription(task.getBody());
		if (body) {
			parts.push(body);
		}

		if (settings.linkPlacement === "Description" || settings.linkPlacement === "Both") {
			parts.push(task.getLocation());
		}

		return parts.join("\n");
	}

	private shouldIncludeLocation(settings: Settings): boolean {
		return settings.linkPlacement === "Location" || settings.linkPlacement === "Both";
	}

	private cleanSummary(value: string): string {
		if (!value) return "";

		return this.cleanInlineText(value)
			.replace(/\([^()]*\b[a-zA-Z][\w-]*::[^()]*\)/g, "")
			.replace(/(^|\s)#[^\s#]+/g, "$1")
			.replace(/\s+/g, " ")
			.trim();
	}

	private cleanDescription(value: string): string {
		if (!value) return "";

		return value
			.replace(/\r/g, "")
			.split("\n")
			.map((line) => this.cleanDescriptionLine(line))
			.filter((line) => line.length > 0)
			.join("\n")
			.trim();
	}

	private cleanDescriptionLine(line: string): string {
		const trimmed = line.trim();
		if (!trimmed) {
			return "";
		}

		const withoutBullet = trimmed.replace(/^[-*+]\s+/, "");
		if (/^\[?[a-zA-Z][\w-]*::.*\]?$/.test(withoutBullet)) {
			return "";
		}

		return this.cleanInlineText(trimmed)
			.replace(/\([^()]*\b[a-zA-Z][\w-]*::[^()]*\)/g, "")
			.replace(/(^|\s)#[^\s#]+/g, "$1")
			.replace(/\s+/g, " ")
			.trim();
	}

	private cleanInlineText(value: string): string {
		return value
			.replace(/<!--[\s\S]*?-->/g, "")
			.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
			.replace(/\[\[([^\]]+)\]\]/g, "$1")
			.replace(/\*\*([^*]+)\*\*/g, "$1")
			.replace(/__([^_]+)__/g, "$1")
			.replace(/`([^`]+)`/g, "$1");
	}

	private hasExportableSummary(task: Task): boolean {
		return this.stripHiddenOnly(task.getSummary()).trim().length > 0;
	}

	private getTaskBuckets(tasks: Task[], settings: Settings) {
		const exportableTasks = tasks.filter((task) => this.hasExportableSummary(task));
		const datedTasks = exportableTasks.filter((task) => task.hasAnyDate());
		const timedTasks = datedTasks.filter((task) => task.hasTimedDate());
		const untimedTasks = datedTasks.filter((task) => !task.hasTimedDate());
		const floatingTasks = exportableTasks.filter((task) => !task.hasAnyDate());
		const includeEvents = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "EventsOnly";
		const includeTodos = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "TodosOnly";
		const eventCount = includeEvents
			? (settings.includeEventsOrTodos === "EventsAndTodos" ? timedTasks.length : datedTasks.length)
			: 0;
		const todoCount = includeTodos
			? (settings.includeEventsOrTodos === "EventsAndTodos"
				? untimedTasks.length + floatingTasks.length
				: (settings.isOnlyTasksWithoutDatesAreTodos ? floatingTasks.length : exportableTasks.length))
			: 0;
		const todoReasons: Array<{ reason: string; count: number }> = [];
		if (includeTodos) {
			if (settings.includeEventsOrTodos === "EventsAndTodos") {
				if (untimedTasks.length > 0) {
					todoReasons.push({
						reason: "Task has a date but no time, so it is exported as VTODO",
						count: untimedTasks.length,
					});
				}
				if (floatingTasks.length > 0) {
					todoReasons.push({
						reason: "Task has no date, so it stays as floating VTODO",
						count: floatingTasks.length,
					});
				}
			} else if (settings.isOnlyTasksWithoutDatesAreTodos && floatingTasks.length > 0) {
				todoReasons.push({
					reason: "Task has no date, so it stays as floating VTODO",
					count: floatingTasks.length,
				});
			}
		}

		return {
			exportableTasks,
			datedTasks,
			timedTasks,
			untimedTasks,
			floatingTasks,
			eventCount,
			todoCount,
			todoReasons,
		};
	}

	private getUtcTimestamp(): string {
		return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
	}

	private stripHiddenOnly(value: string): string {
		return value.replace(/<!--[\s\S]*?-->/g, "");
	}

	private getTodoStatus(task: Task): string | null {
		switch (task.status) {
			case TaskStatus.InProgress:
				return "IN-PROCESS";
			case TaskStatus.Cancelled:
				return "CANCELLED";
			case TaskStatus.Done:
				return "COMPLETED";
			case TaskStatus.Todo:
			case TaskStatus.Important:
				return "NEEDS-ACTION";
			default:
				return null;
		}
	}

	private addMinutes(date: Date | null, minutes: number): Date | null {
		if (!date || !minutes) {
			return null;
		}

		const nextDate = new Date(date);
		nextDate.setMinutes(nextDate.getMinutes() + minutes);
		return nextDate;
	}

	private formatDateTime(date: Date): string {
		const year = date.getFullYear();
		const month = `${date.getMonth() + 1}`.padStart(2, "0");
		const day = `${date.getDate()}`.padStart(2, "0");
		const hours = `${date.getHours()}`.padStart(2, "0");
		const minutes = `${date.getMinutes()}`.padStart(2, "0");
		const seconds = `${date.getSeconds()}`.padStart(2, "0");
		return `${year}${month}${day}T${hours}${minutes}${seconds}`;
	}

	private formatUtcDateTime(date: Date): string {
		return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
	}
}
