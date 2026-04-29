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

	public info(message: string, object?: unknown): void {
		this.log(message, object);
	}

	public warn(message: string, object?: unknown): void {
		console.warn("[" + new Date().toISOString() + "][warn][ical] " + message);
		if (object) {
			console.warn(object);
		}
	}

	public error(message: string, object?: unknown): void {
		console.error("[" + new Date().toISOString() + "][error][ical] " + message);
		if (object) {
			console.error(object);
		}
	}
}

export function logger(isDebug?: boolean): Logger {
	return Logger.getInstance(isDebug);
}

export function log(message: string, object?: unknown): void {
	return Logger.getInstance().log(message, object);
}

export function warn(message: string, object?: unknown): void {
	return Logger.getInstance().warn(message, object);
}

export function error(message: string, object?: unknown): void {
	return Logger.getInstance().error(message, object);
}
