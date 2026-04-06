import { MetadataCache, TFile, Vault } from "obsidian";
import { Settings, TaskSourceRule } from "../Model/Settings";
import { HeadingsHelper } from "../Service/HeadingsHelper";
import { TaskFinder } from "../Service/TaskFinder";
import { TaskIndex } from "../Service/TaskIndex";
import { logger } from "../Service/Logger";
import { TaskIdentityService, TaskIdentityState } from "./TaskIdentityService";
import { ReasonCount, TaskFilterPolicy } from "./TaskFilterPolicy";

export interface TaskIndexStats {
	discoveredTaskCount: number;
	filteredTaskCount: number;
	exportedTaskCount: number;
	filteredReasons: ReasonCount[];
}

const INDEX_REBUILD_SETTINGS: Array<keyof Settings> = [
	"sourceRules",
	"isDayPlannerPluginFormatEnabled",
	"respectGlobalTaskFilter",
	"globalTaskFilterTags",
	"isIncludeCategoriesEnabled",
	"includeCategories",
	"isExcludeCategoriesEnabled",
	"excludeCategories",
	"isIncludeTasksWithTags",
	"includeTasksWithTags",
	"isExcludeTasksWithTags",
	"excludeTasksWithTags",
	"ignoreCompletedTasks",
	"ignoreOldTasks",
	"oldTaskInDays",
	"howToParseInternalLinks",
];

export class TaskIndexingService {
	private readonly fileStats = new Map<string, TaskIndexStats>();

	constructor(
		private readonly vault: Vault,
		private readonly metadataCache: MetadataCache,
		private readonly taskIndex: TaskIndex,
		private readonly taskFinder: TaskFinder,
		private readonly taskIdentityService: TaskIdentityService,
		private readonly taskFilterPolicy = new TaskFilterPolicy(),
	) {}

	public async rebuild(settings: Settings): Promise<void> {
		logger().log("Rebuilding task index...");
		this.taskIndex.clear();

		for (const file of this.vault.getMarkdownFiles()) {
			await this.indexFile(file, settings);
		}
	}

	public async indexFile(file: TFile, settings: Settings): Promise<void> {
		const sourceRule = this.getSourceRuleForFile(file.path, settings);
		if (!sourceRule) {
			this.taskIndex.removeFile(file.path);
			this.fileStats.delete(file.path);
			return;
		}

		const cache = this.metadataCache.getFileCache(file);
		const fallbackContent = await this.vault.cachedRead(file);
		const listItems = cache?.listItems?.length
			? cache.listItems
			: this.buildFallbackListItems(fallbackContent);

		if (listItems.length === 0) {
			this.taskIndex.removeFile(file.path);
			this.fileStats.delete(file.path);
			return;
		}

		const headings = cache?.headings?.length
			? new HeadingsHelper(cache.headings)
			: this.buildFallbackHeadings(fallbackContent);
		const tasks = await this.taskFinder.findTasks(file, listItems, headings, settings);
		const categories = this.getCategoriesForFile(file.path, sourceRule);
		tasks.forEach((task) => task.setCategories([...new Set([...task.getCategories(), ...categories])]));
		const filterReport = this.taskFilterPolicy.applyWithReport(tasks, settings);
		const filteredTasks = filterReport.tasks;
		this.fileStats.set(file.path, {
			discoveredTaskCount: tasks.length,
			filteredTaskCount: Math.max(tasks.length - filteredTasks.length, 0),
			exportedTaskCount: filteredTasks.length,
			filteredReasons: filterReport.reasons,
		});
		this.taskIdentityService.assign(file.path, filteredTasks);
		this.taskIndex.setTasks(file.path, filteredTasks);
	}

	public removeFile(path: string): void {
		this.taskIndex.removeFile(path);
		this.fileStats.delete(path);
		this.taskIdentityService.removeFile(path);
	}

	public getAllTasks(): ReturnType<TaskIndex["getAllTasks"]> {
		return this.taskIndex.getAllTasks();
	}

	public getTaskIdentityState(): TaskIdentityState {
		return this.taskIdentityService.getState();
	}

	public getIndexStats(): TaskIndexStats {
		const reasonCounts = new Map<string, number>();
		const totals = [...this.fileStats.values()].reduce<TaskIndexStats>((acc, stats) => {
			stats.filteredReasons.forEach(({ reason, count }) => {
				reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + count);
			});

			return {
				discoveredTaskCount: acc.discoveredTaskCount + stats.discoveredTaskCount,
				filteredTaskCount: acc.filteredTaskCount + stats.filteredTaskCount,
				exportedTaskCount: acc.exportedTaskCount + stats.exportedTaskCount,
				filteredReasons: [],
			};
		}, {
			discoveredTaskCount: 0,
			filteredTaskCount: 0,
			exportedTaskCount: 0,
			filteredReasons: [],
		});

		return {
			...totals,
			filteredReasons: [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })),
		};
	}

	public async renameFile(file: TFile, oldPath: string, settings: Settings): Promise<void> {
		this.taskIndex.removeFile(oldPath);
		this.taskIdentityService.renameFile(oldPath, file.path);
		await this.indexFile(file, settings);
	}

	public async handleSettingsChange(previous: Settings, next: Settings): Promise<void> {
		if (!INDEX_REBUILD_SETTINGS.some((key) => previous[key] !== next[key])) {
			return;
		}

		await this.rebuild(next);
	}

	private buildFallbackListItems(content: string) {
		return content
			.split("\n")
			.map((line, index) => ({ line, index }))
			.filter(({ line }) => /^\s*(?:>\s*)*[*+-]\s*\[.?]\s*/.test(line))
			.map(({ index }) => ({ position: { start: { line: index } } }));
	}

	private buildFallbackHeadings(content: string): HeadingsHelper | null {
		const headings = content
			.split("\n")
			.map((line, index) => ({ line, index }))
			.filter(({ line }) => /^\s{0,3}#{1,6}\s+/.test(line))
			.map(({ line, index }) => ({
				heading: line.replace(/^\s{0,3}#{1,6}\s+/, "").trim(),
				position: { start: { line: index } },
			}));

		return headings.length > 0 ? new HeadingsHelper(headings as never[]) : null;
	}

	private getSourceRuleForFile(filePath: string, settings: Settings): TaskSourceRule | null {
		const rules = settings.sourceRules;
		const matchingRules = rules.filter((rule) => this.isFileWithinRootPath(filePath, rule.path));
		if (matchingRules.length === 0) {
			return null;
		}

		return matchingRules.sort((left, right) => right.path.length - left.path.length)[0];
	}

	private isFileWithinRootPath(filePath: string, rootPath: string): boolean {
		if (rootPath === "/" || rootPath === "") {
			return true;
		}

		const normalizedRoot = rootPath.replace(/\/+$/, "");
		return filePath === normalizedRoot || filePath.startsWith(`${normalizedRoot}/`);
	}

	private getCategoriesForFile(filePath: string, sourceRule: TaskSourceRule): string[] {
		const categories = new Set<string>();
		if (sourceRule.category.trim().length > 0) {
			categories.add(sourceRule.category.trim());
		}

		const folderPath = filePath.includes("/") ? filePath.slice(0, filePath.lastIndexOf("/")) : "";
		if (folderPath) {
			categories.add(folderPath);
		}

		return [...categories];
	}
}
