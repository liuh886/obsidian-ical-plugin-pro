export class ErrorHelper {
	public static get(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}

		if (typeof error === "object" && error !== null) {
			try {
				return JSON.stringify(error);
			} catch {
				return "Unknown error object";
			}
		}

		if (
			typeof error === "string"
			|| typeof error === "number"
			|| typeof error === "boolean"
			|| typeof error === "bigint"
			|| typeof error === "symbol"
			|| typeof error === "undefined"
		) {
			return String(error);
		}

		return "Unknown error";
	}
}
