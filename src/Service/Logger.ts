export class Logger {
	private static instance: Logger;
	public isDebug: boolean;

	constructor(isDebug: boolean) {
		this.isDebug = isDebug;
	}

	public static getInstance(isDebug?: boolean): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(isDebug ?? false);
		} else if (isDebug !== undefined) {
			Logger.instance.isDebug = isDebug;
		}
		return Logger.instance;
	}

	public log(message: string, object?: unknown): void {
		if (this.isDebug) {
			console.debug("[" + new Date().toISOString() + "][info][ical] " + message);
			if (object) {
				console.debug(object);
			}
		}
	}
}

export function logger(isDebug?: boolean): Logger {
	return Logger.getInstance(isDebug);
}

export function log(message: string, object?: unknown): void {
	return Logger.getInstance().log(message, object);
}
