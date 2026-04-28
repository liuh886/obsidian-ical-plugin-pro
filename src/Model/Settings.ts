export type InternalLinkMode = "DoNotModifyThem" | "KeepTitle" | "PreferTitle" | "RemoveThem";
export type CalendarEntryMode = "EventsOnly" | "EventsAndTodos" | "TodosOnly";
export type MultipleDateMode = "PreferDueDate" | "PreferStartDate" | "CreateMultipleEvents";
export type LinkPlacement = "Description" | "Location" | "Both";

export interface TaskSourceRule {
	path: string;
	category: string;
}

export interface Settings {
	githubPersonalAccessToken: string;
	githubGistId: string;
	githubUsername: string;
	filename: string;
	isPeriodicSaveEnabled: boolean;
	periodicSaveInterval: number;
	isSaveToGistEnabled: boolean;
	isSaveToFileEnabled: boolean;
	savePath: string;
	howToParseInternalLinks: InternalLinkMode;
	ignoreCompletedTasks: boolean;
	isDebug: boolean;
	includeEventsOrTodos: CalendarEntryMode;
	isOnlyTasksWithoutDatesAreTodos: boolean;
	ignoreOldTasks: boolean;
	oldTaskInDays: number;
	howToProcessMultipleDates: MultipleDateMode;
	isDayPlannerPluginFormatEnabled: boolean;
	respectGlobalTaskFilter: boolean;
	globalTaskFilterTags: string;
	isIncludeCategoriesEnabled: boolean;
	includeCategories: string;
	isExcludeCategoriesEnabled: boolean;
	excludeCategories: string;
	isIncludeTasksWithTags: boolean;
	includeTasksWithTags: string;
	isExcludeTasksWithTags: boolean;
	excludeTasksWithTags: string;
	rootPath: string;
	sourceRules: TaskSourceRule[];
	excludedPaths: string[];
	linkPlacement: LinkPlacement;
	enableAlarms: boolean;
	defaultAlarmOffset: number;
}

export const HOW_TO_PARSE_INTERNAL_LINKS = {
	DoNotModifyThem: "Do not modify them (default)",
	KeepTitle: "Keep the title",
	PreferTitle: "Prefer the title",
	RemoveThem: "Remove them",
};

export const INCLUDE_EVENTS_OR_TODOS = {
	EventsOnly: "Events only",
	EventsAndTodos: "Events and todo items",
	TodosOnly: "Todo items only",
};

export const HOW_TO_PROCESS_MULTIPLE_DATES = {
	PreferDueDate: "Prefer due date (default)",
	PreferStartDate: "Prefer start date",
	CreateMultipleEvents: "Create an event per start/scheduled/due date",
};

export const LINK_PLACEMENT = {
	Description: "Description only",
	Location: "Location only",
	Both: "Description and location",
};

export const DEFAULT_SETTINGS: Settings = {
	githubPersonalAccessToken: "",
	githubGistId: "",
	githubUsername: "",
	filename: "obsidian.ics",
	isPeriodicSaveEnabled: true,
	periodicSaveInterval: 5,
	isSaveToGistEnabled: false,
	isSaveToFileEnabled: true,
	savePath: "/",
	howToParseInternalLinks: "DoNotModifyThem",
	ignoreCompletedTasks: false,
	isDebug: false,
	includeEventsOrTodos: "EventsAndTodos",
	isOnlyTasksWithoutDatesAreTodos: true,
	ignoreOldTasks: false,
	oldTaskInDays: 365,
	howToProcessMultipleDates: "PreferDueDate",
	isDayPlannerPluginFormatEnabled: false,
	respectGlobalTaskFilter: false,
	globalTaskFilterTags: "#task",
	isIncludeCategoriesEnabled: false,
	includeCategories: "",
	isExcludeCategoriesEnabled: false,
	excludeCategories: "",
	isIncludeTasksWithTags: false,
	includeTasksWithTags: "#calendar",
	isExcludeTasksWithTags: false,
	excludeTasksWithTags: "#ignore",
	rootPath: "/",
	sourceRules: [],
	excludedPaths: [],
	linkPlacement: "Location",
	enableAlarms: true,
	defaultAlarmOffset: 20,
};

type LegacySettings = Partial<Settings> & {
	isIncludeLinkInDescription?: boolean;
	saveFileName?: string;
	saveFileExtension?: string;
	savePath?: string;
};

export const migrateSettings = (raw: LegacySettings | null | undefined): Settings => {
	const settings = Object.assign({}, DEFAULT_SETTINGS, raw ?? {});
	const legacyFilename = settings.saveFileName?.trim();

	if (!raw?.filename && legacyFilename) {
		const extension = settings.saveFileExtension?.trim() || ".ics";
		settings.filename = `${legacyFilename}${extension.startsWith(".") ? extension : `.${extension}`}`;
	}

	if ((raw?.isIncludeLinkInDescription ?? null) !== null && !raw?.linkPlacement) {
		settings.linkPlacement = raw?.isIncludeLinkInDescription ? "Both" : "Location";
	}

	if (!settings.savePath) {
		settings.savePath = "/";
	}

	if (!Array.isArray(raw?.excludedPaths)) {
		settings.excludedPaths = [];
	}

	if (!Array.isArray(raw?.sourceRules) || raw.sourceRules.length === 0) {
		settings.sourceRules = [{ path: settings.rootPath || "/", category: "" }];
	}

	settings.sourceRules = settings.sourceRules
		.map((rule) => ({
			path: rule?.path?.trim() ? rule.path.trim() : "/",
			category: rule?.category?.trim() ?? "",
		}))
		.filter((rule, index, rules) => rule.path.length > 0 && rules.findIndex((candidate) => candidate.path === rule.path && candidate.category === rule.category) === index);

	return settings;
};

export const prepareSettingsForSave = (settings: Settings): Settings => {
	const normalizedSourceRules = settings.sourceRules.length > 0
		? settings.sourceRules
		: [{ path: "/", category: "" }];

	return {
		...settings,
		sourceRules: normalizedSourceRules,
		rootPath: normalizedSourceRules[0]?.path ?? settings.rootPath,
	};
};
