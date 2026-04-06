import { requestUrl } from "obsidian";
import { Settings } from "../Model/Settings";
import { CalendarDestination } from "./CalendarDestination";

export class GistClient implements CalendarDestination {
	public readonly name = "github-gist";

	constructor() {}

	public isEnabled(settings: Settings): boolean {
		return settings.isSaveToGistEnabled;
	}

	public async save(calendarContent: string, settings: Settings): Promise<void> {
		const { githubPersonalAccessToken, githubGistId, filename, isDebug } = settings;

		if (!githubPersonalAccessToken || !githubGistId) {
			throw new Error("GitHub Gist sync is enabled but Token or Gist ID is missing.");
		}

		const fname = filename || "obsidian.ics";
		
		if (isDebug) {
			console.log("iCal Pro: Starting Gist Sync...");
			console.log(`iCal Pro: Target Gist ID: ${githubGistId}`);
			console.log(`iCal Pro: Target Filename: ${fname}`);
			console.log(`iCal Pro: Content Length: ${calendarContent.length} chars`);
		}

		try {
			const response = await requestUrl({
				url: `https://api.github.com/gists/${githubGistId}`,
				method: "PATCH",
				headers: {
					"Authorization": `Bearer ${githubPersonalAccessToken}`,
					"Accept": "application/vnd.github.v3+json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					files: {
						[fname]: {
							content: calendarContent,
						},
					},
				}),
			});

			if (response.status === 200) {
				if (isDebug) console.log("iCal Pro: Gist updated successfully!");
			} else {
				const errorMsg = `GitHub API Error ${response.status}: ${response.text}`;
				console.error("iCal Pro: Gist Update Failed.", errorMsg);
				throw new Error(errorMsg);
			}
		} catch (error: unknown) {
			const httpError = error as { status?: number };
			if (httpError.status === 404) {
				throw new Error(`Gist not found. Check your Gist ID and ensure file '${fname}' exists in it.`);
			}
			throw error;
		}
	}
}
