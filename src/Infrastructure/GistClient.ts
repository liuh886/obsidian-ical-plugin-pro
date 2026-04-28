import { requestUrl } from "obsidian";
import { Settings } from "../Model/Settings";
import { CalendarDestination } from "./CalendarDestination";
import { logger } from "../Service/Logger";

export class GistClient implements CalendarDestination {
	public readonly name = "github-gist";

	constructor() {}

	public isEnabled(settings: Settings): boolean {
		return settings.isSaveToGistEnabled;
	}

	public async save(calendarContent: string, settings: Settings): Promise<void> {
		const { githubPersonalAccessToken, githubGistId, filename } = settings;

		if (!githubPersonalAccessToken || !githubGistId) {
			throw new Error("GitHub Gist sync is enabled but token or gist id is missing.");
		}

		const fname = filename || "obsidian.ics";
		
		logger().info("iCal Pro: Starting gist sync...");
		logger().info(`iCal Pro: Target gist id: ${githubGistId}`);
		logger().info(`iCal Pro: Target filename: ${fname}`);
		logger().info(`iCal Pro: Content length: ${calendarContent.length} chars`);

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
				logger().info("iCal Pro: Gist updated successfully!");
			} else {
				const errorMsg = `GitHub API Error ${response.status}: ${response.text}`;
				logger().error("iCal Pro: Gist update failed.", errorMsg);
				throw new Error(errorMsg);
			}
		} catch (error: unknown) {
			const httpError = error as { status?: number };
			if (httpError.status === 404) {
				throw new Error(`Gist not found. Check your gist id and ensure file '${fname}' exists in it.`);
			}
			throw error;
		}
	}
}
