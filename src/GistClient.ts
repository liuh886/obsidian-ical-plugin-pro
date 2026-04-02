import { requestUrl } from "obsidian";
import { Settings } from "./Model/Settings";
import { logger } from "./Logger";

export class GistClient {
	private settings: Settings;

	constructor(settings: Settings) {
		this.settings = settings;
	}

	public async save(calendarContent: string): Promise<boolean> {
		const { githubPersonalAccessToken, githubGistId, filename } = this.settings;

		if (!githubPersonalAccessToken || !githubGistId) {
			logger(this.settings.isDebug).log("Gist sync skipped: Missing Token or Gist ID.");
			return false;
		}

		const fname = filename || "obsidian.ics";

		try {
			const response = await requestUrl({
				url: `https://api.github.com/gists/${githubGistId}`,
				method: "PATCH",
				headers: {
					"Authorization": `token ${githubPersonalAccessToken}`,
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
				logger(this.settings.isDebug).log("Successfully updated Gist.");
				return true;
			} else {
				console.error("Gist update failed:", response.text);
				return false;
			}
		} catch (error) {
			console.error("Gist update error:", error);
			return false;
		}
	}
}
