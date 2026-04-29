import { App, Notice, PluginSettingTab, Setting, normalizePath, setIcon } from "obsidian";
import ObsidianIcalPlugin from "../ObsidianIcalPlugin";
import { FolderSuggest } from "./FolderSuggest";
import {
	CalendarEntryMode,
	HOW_TO_PARSE_INTERNAL_LINKS,
	HOW_TO_PROCESS_MULTIPLE_DATES,
	INCLUDE_EVENTS_OR_TODOS,
	InternalLinkMode,
	LINK_PLACEMENT,
	LinkPlacement,
	MultipleDateMode,
	TaskSourceRule,
} from "../Model/Settings";

function isCalendarEntryMode(value: string): value is CalendarEntryMode {
	return Object.prototype.hasOwnProperty.call(INCLUDE_EVENTS_OR_TODOS, value);
}

function isMultipleDateMode(value: string): value is MultipleDateMode {
	return Object.prototype.hasOwnProperty.call(HOW_TO_PROCESS_MULTIPLE_DATES, value);
}

function isInternalLinkMode(value: string): value is InternalLinkMode {
	return Object.prototype.hasOwnProperty.call(HOW_TO_PARSE_INTERNAL_LINKS, value);
}

function isLinkPlacement(value: string): value is LinkPlacement {
	return Object.prototype.hasOwnProperty.call(LINK_PLACEMENT, value);
}

export class SettingsTab extends PluginSettingTab {
	private readonly pendingUpdates = new Map<string, number>();

	constructor(app: App, private readonly plugin: ObsidianIcalPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const header = containerEl.createDiv({ cls: "ical-pro-header" });
		const headerText = header.createDiv({ cls: "ical-pro-header-title" });
		new Setting(headerText).setHeading().setName("Calendar sync").setDesc("v" + this.plugin.manifest.version);

		const authorInfo = header.createDiv({ cls: "ical-pro-author" });
		authorInfo.createSpan({ text: "by " });
		authorInfo.createEl("a", {
			text: "Liuh886",
			href: "https://github.com/liuh886",
			cls: "ical-pro-author-link",
		});
		authorInfo.createSpan({ text: " | " });
		authorInfo.createEl("a", {
			text: "GitHub repository",
			href: "https://github.com/liuh886/obsidian-ical-plugin-pro",
			cls: "ical-pro-repo-link",
		});

		this.renderStatusCard(containerEl);
		this.renderTaskSourceSettings(containerEl);
		this.renderDateSettings(containerEl);
		this.renderFilteringSettings(containerEl);
		this.renderDestinationSettings(containerEl);
		this.renderAdvancedSettings(containerEl);
		this.renderSupportSection(containerEl);
	}

	private renderSupportSection(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "heart", "Support the project");

		const supportDiv = containerEl.createDiv({ cls: "ical-pro-support" });
		supportDiv.createEl("p", {
			text: "If this plugin helps you stay organized, consider supporting its development.",
			cls: "setting-item-description",
		});

		const kofiLink = supportDiv.createEl("a", {
			href: "https://ko-fi.com/F1F7WYJ6B",
		});
		kofiLink.createEl("img", {
			attr: {
				src: "https://ko-fi.com/img/githubbutton_sm.svg",
				alt: "ko-fi",
			},
			cls: "ical-pro-kofi-img",
		});
	}

	private renderStatusCard(containerEl: HTMLElement): void {
		const statusCard = containerEl.createDiv({ cls: "ical-pro-status-card" });
		const statusGrid = statusCard.createDiv({ cls: "ical-pro-status-grid" });

		const urlCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const statusTitle = urlCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Subscription url" });
		const urlContainer = urlCol.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		const syncCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const syncTitle = syncCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(syncTitle, "refresh-cw");
		syncTitle.createSpan({ text: " Sync status" });
		const syncInfo = syncCol.createDiv({ cls: "ical-sync-info" });
		syncInfo.createEl("div", { text: `Result: ${this.plugin.lastSyncStatus}`, cls: `ical-status-${this.plugin.lastSyncStatus.toLowerCase()}` });
		syncInfo.createEl("div", { text: `At: ${this.plugin.lastSyncTime}`, cls: "ical-sync-time" });
		if (this.plugin.lastSyncMessage) {
			syncInfo.createEl("div", { text: this.plugin.lastSyncMessage, cls: "ical-sync-time" });
		}
		const readiness = this.plugin.getSyncReadiness();
		if (readiness.ready) {
			syncInfo.createEl("div", { text: `Ready: ${readiness.activeDestinations.join(", ")}`, cls: "ical-sync-time" });
		} else {
			readiness.issues.forEach((issue) => {
				syncInfo.createEl("div", { text: issue, cls: "ical-sync-time" });
			});
		}
		const preview = this.plugin.getSyncPreview();
		syncInfo.createEl(
			"div",
			{
				text: `Preview: ${preview.exportedTaskCount} exported, ${preview.eventCount} VEVENT, ${preview.todoCount} VTODO, ${preview.filteredTaskCount} filtered`,
				cls: "ical-sync-time",
			},
		);
		preview.filteredReasons.forEach((entry) => {
			syncInfo.createEl("div", {
				text: `Filtered: ${entry.reason} (${entry.count})`,
				cls: "ical-sync-time",
			});
		});
		preview.todoReasons.forEach((entry) => {
			syncInfo.createEl("div", {
				text: `VTODO: ${entry.reason} (${entry.count})`,
				cls: "ical-sync-time",
			});
		});
		const recentResult = this.plugin.syncHistory[0];
		if (recentResult?.destinationResults.length) {
			recentResult.destinationResults.forEach((result) => {
				syncInfo.createEl(
					"div",
					{
						text: `${result.name}: ${result.status}${result.message ? ` - ${result.message}` : ""}`,
						cls: "ical-sync-time",
					},
				);
			});
		}

		const syncBtn = syncCol.createEl("button", { text: "Sync now", cls: "mod-cta ical-sync-button" });
		syncBtn.onClickEvent(() => {
			this.runAsync(async () => {
				syncBtn.disabled = true;
				syncBtn.setText("Syncing now...");
				try {
					await this.plugin.saveCalendar();
					new Notice("Sync successful.");
				} catch {
					new Notice(`iCal Pro: sync failed. ${this.plugin.lastSyncMessage}`);
				} finally {
					this.display();
				}
			});
		});
		const diagnosticsBtn = syncCol.createEl("button", { text: "Copy diagnostics", cls: "ical-sync-button" });
		diagnosticsBtn.onClickEvent(() => {
			void navigator.clipboard.writeText(this.plugin.getDiagnosticsBundle());
			new Notice("Diagnostics copied.");
		});
	}

	private renderTaskSourceSettings(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "search", "Scope and discovery");

		containerEl.createEl("p", {
			text: "Bind one source path to one category. Use multiple rules when you want different folders exported as different calendar categories.",
			cls: "setting-item-description",
		});

		const rulesContainer = containerEl.createDiv({ cls: "ical-pro-source-rules" });
		this.plugin.settings.sourceRules.forEach((rule, index) => {
			this.renderSourceRuleSetting(rulesContainer, rule, index);
		});

		new Setting(containerEl)
			.setName("Add source path")
			.setDesc("Add another path/category rule.")
			.addButton((button) =>
				button.setButtonText("Add path").onClick(() => {
					this.runAsync(async () => {
						await this.plugin.updateSettings(
							{
								sourceRules: [...this.plugin.settings.sourceRules, { path: "/", category: "" }],
							},
							{ rebuildIndex: true },
						);
						this.display();
					});
				}),
			);

		containerEl.createEl("p", {
			text: "Specify folders or files to explicitly ignore. Tasks in these paths will never be indexed.",
			cls: "setting-item-description",
		});

		const excludedContainer = containerEl.createDiv({ cls: "ical-pro-excluded-paths" });
		this.plugin.settings.excludedPaths.forEach((path, index) => {
			this.renderExcludedPathSetting(excludedContainer, path, index);
		});

		new Setting(containerEl)
			.setName("Add excluded path")
			.setDesc("Add another folder or file to ignore.")
			.addButton((button) =>
				button.setButtonText("Add exclusion").onClick(() => {
					this.runAsync(async () => {
						await this.plugin.updateSettings(
							{
								excludedPaths: [...this.plugin.settings.excludedPaths, "/"],
							},
							{ rebuildIndex: true },
						);
						this.display();
					});
				}),
			);
	}

	private renderDateSettings(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "calendar-days", "Scheduling and alarms");

		new Setting(containerEl)
			.setName("Time-block logic (day planner)")
			.setDesc("If enabled, treats daily note headings as dates and task times as event start points.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings(
						{ isDayPlannerPluginFormatEnabled: value },
						{ rebuildIndex: true },
					));
				}),
			);

		new Setting(containerEl)
			.setName("Sync strategy")
			.setDesc("Define how dated tasks are mapped. Events are time-boxed; to-dos are status-tracked.")
			.addDropdown((dropdown) => {
				Object.entries(INCLUDE_EVENTS_OR_TODOS).forEach(([value, label]) => {
					dropdown.addOption(value, label);
				});
				dropdown.setValue(this.plugin.settings.includeEventsOrTodos).onChange((value) => {
					if (isCalendarEntryMode(value)) {
						void this.plugin.updateSettings({ includeEventsOrTodos: value });
					}
				});
			});

		new Setting(containerEl)
			.setName("Multiple date handling")
			.setDesc("How to handle tasks that contain multiple start, scheduled, or due dates.")
			.addDropdown((dropdown) => {
				Object.entries(HOW_TO_PROCESS_MULTIPLE_DATES).forEach(([value, label]) => {
					dropdown.addOption(value, label);
				});
				dropdown.setValue(this.plugin.settings.howToProcessMultipleDates).onChange((value) => {
					if (isMultipleDateMode(value)) {
						void this.plugin.updateSettings({ howToProcessMultipleDates: value });
					}
				});
			});

		new Setting(containerEl)
			.setName("Enable native notifications")
			.setDesc("Include alerts in your calendar app. Use the alarm emoji with a minute offset to set a custom reminder.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableAlarms).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ enableAlarms: value }));
				}),
			)
			.addSlider((slider) =>
				slider
					.setLimits(5, 180, 5)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.defaultAlarmOffset)
					.onChange((value) => {
						this.runAsync(() => this.plugin.updateSettings({ defaultAlarmOffset: value }));
					}),
			);
	}

	private renderFilteringSettings(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "filter", "Content and filters");

		new Setting(containerEl)
			.setName("Respect tasks global filter")
			.setDesc("Require these tags for a checkbox to count as a real task.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.respectGlobalTaskFilter).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ respectGlobalTaskFilter: value }, { rebuildIndex: true }));
				}),
			)
			.addText((text) =>
				text.setPlaceholder("#task").setValue(this.plugin.settings.globalTaskFilterTags).onChange((value) => {
					this.scheduleUpdate("globalTaskFilterTags", () =>
						this.plugin.updateSettings(
							{ globalTaskFilterTags: value || "#task" },
							{ rebuildIndex: true },
						),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Category inclusion filter")
			.setDesc("Only export tasks whose derived categories match these values (space separated).")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isIncludeCategoriesEnabled).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ isIncludeCategoriesEnabled: value }, { rebuildIndex: true }));
				}),
			)
			.addText((text) =>
				text.setPlaceholder("Work travel/asia").setValue(this.plugin.settings.includeCategories).onChange((value) => {
					this.scheduleUpdate("includeCategories", () =>
						this.plugin.updateSettings(
							{ includeCategories: value },
							{ rebuildIndex: true },
						),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Category exclusion filter")
			.setDesc("Hide tasks whose derived categories match these values.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isExcludeCategoriesEnabled).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ isExcludeCategoriesEnabled: value }, { rebuildIndex: true }));
				}),
			)
			.addText((text) =>
				text.setPlaceholder("Personal archive").setValue(this.plugin.settings.excludeCategories).onChange((value) => {
					this.scheduleUpdate("excludeCategories", () =>
						this.plugin.updateSettings(
							{ excludeCategories: value },
							{ rebuildIndex: true },
						),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Tag inclusion filter")
			.setDesc("Only sync tasks containing these tags (space separated).")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isIncludeTasksWithTags).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings(
						{ isIncludeTasksWithTags: value },
						{ rebuildIndex: true },
					));
				}),
			)
			.addText((text) =>
				text.setPlaceholder("#work #sync").setValue(this.plugin.settings.includeTasksWithTags).onChange((value) => {
					this.scheduleUpdate("includeTasksWithTags", () =>
						this.plugin.updateSettings(
							{ includeTasksWithTags: value },
							{ rebuildIndex: true },
						),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Tag exclusion filter")
			.setDesc("Ignore tasks containing these tags.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isExcludeTasksWithTags).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings(
						{ isExcludeTasksWithTags: value },
						{ rebuildIndex: true },
					));
				}),
			)
			.addText((text) =>
				text.setPlaceholder("#private").setValue(this.plugin.settings.excludeTasksWithTags).onChange((value) => {
					this.scheduleUpdate("excludeTasksWithTags", () =>
						this.plugin.updateSettings(
							{ excludeTasksWithTags: value },
							{ rebuildIndex: true },
						),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Ignore completed")
			.setDesc("Do not sync tasks that are already marked as done.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.ignoreCompletedTasks).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ ignoreCompletedTasks: value }, { rebuildIndex: true }));
				}),
			);
	}

	private renderDestinationSettings(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "cloud", "Sync and cloud connectivity");

		new Setting(containerEl)
			.setName("Calendar filename")
			.setDesc("Used for both local storage and hosted gist sync, for example calendar.ics.")
			.addText((text) =>
				text.setPlaceholder("Calendar.ics").setValue(this.plugin.settings.filename).onChange((value) => {
					this.scheduleUpdate("filename", async () => {
						await this.plugin.updateSettings({ filename: value || "obsidian.ics" });
						this.updateUrlDisplay();
					});
				}),
			);

		new Setting(containerEl)
			.setName("Save to local file")
			.setDesc("Export the .ics file to your vault for local sync workflows.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isSaveToFileEnabled).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ isSaveToFileEnabled: value }));
				}),
			);

		new Setting(containerEl)
			.setName("Vault storage path")
			.setDesc("Specify the folder for the local .ics file relative to vault root.")
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setValue(this.plugin.settings.savePath).onChange((value) => {
					this.scheduleUpdate("savePath", () =>
						this.plugin.updateSettings({ savePath: normalizePath(value) || "/" }),
					);
				});
			});

		new Setting(containerEl)
			.setName("Sync to hosted gist")
			.setDesc("Publish your calendar to a private gist for subscriptions across devices.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isSaveToGistEnabled).onChange((value) => {
					this.runAsync(async () => {
						await this.plugin.updateSettings({ isSaveToGistEnabled: value });
						this.updateUrlDisplay();
					});
				}),
			);

		new Setting(containerEl)
			.setName("GitHub username")
			.setDesc("Used to build the raw subscription link for your hosted gist.")
			.addText((text) =>
				text.setValue(this.plugin.settings.githubUsername).onChange((value) => {
					this.scheduleUpdate("githubUsername", async () => {
						await this.plugin.updateSettings({ githubUsername: value });
						this.updateUrlDisplay();
					});
				}),
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.setDesc(this.createDescriptionWithLink(
				"Enter the identifier from the gist link used as the sync target. ",
				"Open Gist",
				"https://gist.github.com/",
			))
			.addText((text) =>
				text.setValue(this.plugin.settings.githubGistId).onChange((value) => {
					this.scheduleUpdate("githubGistId", async () => {
						await this.plugin.updateSettings({ githubGistId: value });
						this.updateUrlDisplay();
					});
				}),
			);

		new Setting(containerEl)
			.setName("Personal access token")
			.setDesc(this.createDescriptionWithLink(
				"Personal access token with 'gist' scope. ",
				"Create token",
				"https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token",
			))
			.addText((text) =>
				text.setPlaceholder("Paste access token").setValue(this.plugin.settings.githubPersonalAccessToken).onChange((value) => {
					this.scheduleUpdate("githubPersonalAccessToken", () =>
						this.plugin.updateSettings({ githubPersonalAccessToken: value }),
					);
				}),
			);

		new Setting(containerEl)
			.setName("Validate gist access")
			.setDesc("Check whether the configured token and identifier are reachable.")
			.addButton((button) =>
				button.setButtonText("Validate").onClick(() => {
					this.runAsync(async () => {
						button.setDisabled(true);
						button.setButtonText("Checking access...");
						const result = await this.plugin.validateConnection();
						new Notice(result.message);
						button.setDisabled(false);
						button.setButtonText("Validate");
					});
				}),
			);
	}

	private renderAdvancedSettings(containerEl: HTMLElement): void {
		this.addHeader(containerEl, "sliders", "Advanced and diagnostics");

		new Setting(containerEl)
			.setName("Summary formatting")
			.setDesc("Choose how note links should be rendered in the calendar.")
			.addDropdown((dropdown) => {
				Object.entries(HOW_TO_PARSE_INTERNAL_LINKS).forEach(([value, label]) => {
					dropdown.addOption(value, label);
				});
				dropdown.setValue(this.plugin.settings.howToParseInternalLinks).onChange((value) => {
					if (isInternalLinkMode(value)) {
						void this.plugin.updateSettings(
							{ howToParseInternalLinks: value },
							{ rebuildIndex: true },
						);
					}
				});
			});

		new Setting(containerEl)
			.setName("Obsidian link placement")
			.setDesc("Where to place the app callback link in calendar entries.")
			.addDropdown((dropdown) => {
				Object.entries(LINK_PLACEMENT).forEach(([value, label]) => {
					dropdown.addOption(value, label);
				});
				dropdown.setValue(this.plugin.settings.linkPlacement).onChange((value) => {
					if (isLinkPlacement(value)) {
						void this.plugin.updateSettings({ linkPlacement: value });
					}
				});
			});

		new Setting(containerEl)
			.setName("Auto-sync interval")
			.setDesc("Frequency (in minutes) at which the calendar is regenerated and pushed.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isPeriodicSaveEnabled).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ isPeriodicSaveEnabled: value }, { rescheduleSync: true }));
				}),
			)
			.addSlider((slider) =>
				slider
					.setLimits(5, 120, 5)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.periodicSaveInterval)
					.onChange((value) => {
						this.runAsync(() => this.plugin.updateSettings({ periodicSaveInterval: value }, { rescheduleSync: true }));
					}),
			);


		new Setting(containerEl)
			.setName("Debug mode")
			.setDesc("Enable verbose logging in the console (Ctrl+Shift+I).")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isDebug).onChange((value) => {
					this.runAsync(() => this.plugin.updateSettings({ isDebug: value }));
				}),
			);

		containerEl.createEl("p", {
			text: "The status card above also provides a live sync preview, per-destination result report, and a copyable diagnostics bundle for issue reports.",
			cls: "setting-item-description",
		});
	}

	private addHeader(el: HTMLElement, icon: string, text: string): void {
		const header = el.createDiv({ cls: "ical-pro-section-header" });
		const iconEl = header.createDiv({ cls: "ical-pro-section-icon" });
		setIcon(iconEl, icon);
		new Setting(header).setHeading().setName(text);
	}

	private updateUrlDisplay(): void {
		const container = this.containerEl.querySelector(".ical-url-container");
		if (!container) return;

		container.empty();
		this.renderUrl(container as HTMLElement);
	}

	private renderUrl(container: HTMLElement): void {
		const username = this.plugin.settings.githubUsername;
		const gistId = this.plugin.settings.githubGistId;
		const filename = this.plugin.settings.filename || "obsidian.ics";
		const localPath = this.plugin.settings.savePath === "/"
			? filename
			: `${this.plugin.settings.savePath}/${filename}`;

		if (this.plugin.settings.isSaveToGistEnabled && username && gistId) {
			const url = `https://gist.githubusercontent.com/${username}/${gistId}/raw/${filename}`;
			container.createEl("code", { text: url, cls: "ical-url-text" });
			const copyBtn = container.createEl("button", { text: "Copy link", cls: "mod-cta" });
			copyBtn.onClickEvent(() => {
				void navigator.clipboard.writeText(url);
				copyBtn.setText("Copied.");
				window.setTimeout(() => copyBtn.setText("Copy link"), 2000);
			});
			return;
		}

		if (this.plugin.settings.isSaveToFileEnabled) {
			container.createEl("code", { text: localPath, cls: "ical-url-text" });
			container.createEl("p", { text: "Local file export is enabled. Subscribe to this file from your calendar app.", cls: "ical-url-placeholder" });
			return;
		}

		container.createEl("p", { text: "No active calendar destination. Enable hosted gist sync or local file export.", cls: "ical-url-placeholder" });
	}

	private scheduleUpdate(key: string, task: () => Promise<void>, delay = 250): void {
		const existing = this.pendingUpdates.get(key);
		if (existing !== undefined) {
			window.clearTimeout(existing);
		}

		const timeoutId = window.setTimeout(() => {
			this.pendingUpdates.delete(key);
			void task();
		}, delay);

		this.pendingUpdates.set(key, timeoutId);
	}

	private runAsync(task: () => Promise<void>): void {
		void task();
	}

	private createDescriptionWithLink(prefix: string, linkText: string, href: string): DocumentFragment {
		const fragment = document.createDocumentFragment();
		fragment.append(prefix);

		const link = document.createElement("a");
		link.href = href;
		link.textContent = linkText;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		fragment.append(link);

		return fragment;
	}

	private renderSourceRuleSetting(containerEl: HTMLElement, rule: TaskSourceRule, index: number): void {
		new Setting(containerEl)
			.setName(`Source path ${index + 1}`)
			.setDesc("Tasks in this path inherit the configured category.")
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text
					.setPlaceholder("/")
					.setValue(rule.path)
					.onChange((value) => {
						this.scheduleSourceRuleUpdate(index, { path: normalizePath(value) || "/" });
					});
			})
			.addText((text) =>
				text
					.setPlaceholder("Work")
					.setValue(rule.category)
					.onChange((value) => {
						this.scheduleSourceRuleUpdate(index, { category: value });
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Remove path rule")
					.onClick(() => {
						this.runAsync(async () => {
							const sourceRules = this.plugin.settings.sourceRules.filter((_, ruleIndex) => ruleIndex !== index);
							await this.plugin.updateSettings(
								{
									sourceRules: sourceRules.length > 0 ? sourceRules : [{ path: "/", category: "" }],
								},
								{ rebuildIndex: true },
							);
							this.display();
						});
					}),
			);
	}

	private renderExcludedPathSetting(containerEl: HTMLElement, path: string, index: number): void {
		new Setting(containerEl)
			.setName(`Excluded path ${index + 1}`)
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text
					.setPlaceholder("/")
					.setValue(path)
					.onChange((value) => {
						this.scheduleExcludedPathUpdate(index, normalizePath(value) || "/");
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Remove exclusion")
					.onClick(() => {
						this.runAsync(async () => {
							const excludedPaths = this.plugin.settings.excludedPaths.filter((_, pathIndex) => pathIndex !== index);
							await this.plugin.updateSettings(
								{
									excludedPaths,
								},
								{ rebuildIndex: true },
							);
							this.display();
						});
					}),
			);
	}

	private scheduleExcludedPathUpdate(index: number, path: string): void {
		this.scheduleUpdate(`excluded-path-${index}`, async () => {
			const excludedPaths = this.plugin.settings.excludedPaths.map((p, pIndex) =>
				pIndex === index ? path : p,
			);
			await this.plugin.updateSettings(
				{
					excludedPaths,
				},
				{ rebuildIndex: true },
			);
		});
	}

	private scheduleSourceRuleUpdate(index: number, patch: Partial<TaskSourceRule>): void {
		this.scheduleUpdate(`source-rule-${index}`, async () => {
			const sourceRules = this.plugin.settings.sourceRules.map((rule, ruleIndex) =>
				ruleIndex === index
					? {
						path: patch.path !== undefined ? patch.path : rule.path,
						category: patch.category !== undefined ? patch.category : rule.category,
					}
					: rule,
			);
			await this.plugin.updateSettings(
				{
					sourceRules,
				},
				{ rebuildIndex: true },
			);
		});
	}
}
