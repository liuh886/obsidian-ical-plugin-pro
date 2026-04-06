import { Vault, normalizePath, TFolder, TFile } from "obsidian";
import { Settings } from "../Model/Settings";
import { CalendarDestination } from "./CalendarDestination";

export class FileClient implements CalendarDestination {
	public readonly name = "local-file";

	constructor(private readonly vault: Vault) {}

	public isEnabled(settings: Settings): boolean {
		return settings.isSaveToFileEnabled;
	}

	public async save(calendar: string, settings: Settings): Promise<void> {
		const { savePath, filename } = settings;
		const path = normalizePath(savePath);
		const fname = filename || "obsidian.ics";
		const fullPath = path === "/" ? fname : `${path}/${fname}`;

		const folder = this.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder) && path !== "/") {
			await this.vault.createFolder(path);
		}

		const file = this.vault.getAbstractFileByPath(fullPath);
		if (file instanceof TFile) {
			await this.vault.modify(file, calendar);
		} else {
			await this.vault.create(fullPath, calendar);
		}
	}
}
