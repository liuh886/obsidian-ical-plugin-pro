import { requestUrl } from "obsidian";
import { Settings } from "./Model/Settings";

export class GistClient {
	private settings: Settings;

	constructor(settings: Settings) {
		this.settings = settings;
	}

	public async save(calendarContent: string): Promise<boolean> {
		const { githubPersonalAccessToken, githubGistId, filename } = this.settings;

		if (!githubPersonalAccessToken || !githubGistId) {
			console.log("iCal Pro: Gist sync skipped - missing configuration.");
			return false;
		}

		const fname = filename || "obsidian.ics";
		console.log(`iCal Pro: Attempting to update Gist ${githubGistId} with file ${fname}...`);

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
				console.log("iCal Pro: Gist updated successfully!");
				return true;
			} else {
				console.error(`iCal Pro: Gist update failed with status ${response.status}`, response.text);
				throw new Error(`GitHub API Error: ${response.status}`);
			}
		} catch (error) {
			console.error("iCal Pro: Network error during Gist sync:", error);
			throw error;
		}
	}
}
