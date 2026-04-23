import { Settings } from "../Model/Settings";

export interface DestinationStatus {
	name: string;
	enabled: boolean;
	ready: boolean;
	issues: string[];
	metadata: Record<string, string | boolean>;
}

export interface DestinationHealthReport {
	ready: boolean;
	activeDestinations: string[];
	issues: string[];
	recommendedNextStep: string;
	destinations: DestinationStatus[];
}

export class DestinationHealthService {
	public evaluate(settings: Settings): DestinationHealthReport {
		const destinations = [
			this.getLocalFileStatus(settings),
			this.getGithubGistStatus(settings),
		];

		const activeDestinations = destinations
			.filter((destination) => destination.enabled)
			.map((destination) => destination.name);
		const issues = destinations.flatMap((destination) => destination.issues);

		if (activeDestinations.length === 0) {
			issues.push("No active calendar destination. Enable local file export or GitHub Gist sync.");
		}

		return {
			ready: issues.length === 0,
			activeDestinations,
			issues,
			recommendedNextStep: this.getRecommendedNextStep(destinations),
			destinations,
		};
	}

	private getLocalFileStatus(settings: Settings): DestinationStatus {
		const normalizedPath = settings.savePath?.trim() || "/";
		const enabled = settings.isSaveToFileEnabled;
		const issues = enabled && !normalizedPath
			? ["Local file export is enabled but no save path is configured."]
			: [];

		return {
			name: "local-file",
			enabled,
			ready: enabled && issues.length === 0,
			issues,
			metadata: {
				configuredPath: normalizedPath,
			},
		};
	}

	private getGithubGistStatus(settings: Settings): DestinationStatus {
		const enabled = settings.isSaveToGistEnabled;
		const username = settings.githubUsername?.trim() || "";
		const gistId = settings.githubGistId?.trim() || "";
		const hasToken = Boolean(settings.githubPersonalAccessToken?.trim());
		const issues: string[] = [];

		if (enabled && !username) {
			issues.push("GitHub Gist sync is enabled but username is missing.");
		}
		if (enabled && !gistId) {
			issues.push("GitHub Gist sync is enabled but Gist ID is missing.");
		}
		if (enabled && !hasToken) {
			issues.push("GitHub Gist sync is enabled but personal access token is missing.");
		}

		return {
			name: "github-gist",
			enabled,
			ready: enabled && issues.length === 0,
			issues,
			metadata: {
				hasUsername: Boolean(username),
				hasGistId: Boolean(gistId),
				hasToken,
				username,
				gistId,
			},
		};
	}

	private getRecommendedNextStep(destinations: DestinationStatus[]): string {
		const localFile = destinations.find((destination) => destination.name === "local-file");
		const githubGist = destinations.find((destination) => destination.name === "github-gist");

		if (!destinations.some((destination) => destination.enabled)) {
			return "Enable 'Save to local file' or 'Sync to hosted gist' before running sync.";
		}

		if (localFile?.enabled && !localFile.ready) {
			return "Set a vault storage path for local file export.";
		}

		if (githubGist?.enabled && !githubGist.ready) {
			return "Complete the GitHub username, Gist ID, and personal access token fields, then validate access.";
		}

		return "No destination issues detected.";
	}
}
