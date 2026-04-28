import { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { Settings } from "../Model/Settings";
import { DestinationHealthService } from "./DestinationHealthService";

export interface ConnectionValidationResult {
	success: boolean;
	message: string;
}

type RequestFn = (request: RequestUrlParam) => Promise<RequestUrlResponse>;

export class ConnectionValidationService {
	private readonly destinationHealthService = new DestinationHealthService();

	constructor(private readonly requestFn: RequestFn) {}

	public async validateGist(settings: Settings): Promise<ConnectionValidationResult> {
		const gistStatus = this.destinationHealthService
			.evaluate(settings)
			.destinations
			.find((destination) => destination.name === "github-gist");

		if (!gistStatus?.enabled) {
			return { success: false, message: "GitHub Gist sync is not enabled." };
		}

		if (!gistStatus.ready) {
			return { success: false, message: gistStatus.issues[0] ?? "GitHub Gist settings are incomplete." };
		}

		try {
			const response = await this.requestFn({
				url: `https://api.github.com/gists/${settings.githubGistId}`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${settings.githubPersonalAccessToken}`,
					Accept: "application/vnd.github.v3+json",
				},
			});

			if (response.status === 200) {
				return { success: true, message: "Connection successful! Gist found." };
			}

			return { success: false, message: `GitHub returned status ${response.status}` };
		} catch {
			return { success: false, message: "Network error or invalid token/gist id." };
		}
	}
}
