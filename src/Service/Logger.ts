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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public log(message: string, object?: any): void {
		if (this.isDebug) {
			console.log("[" + new Date().toISOString() + "][info][ical] " + message);
			if (object) {
				console.log(object);
			}
		}
	}
}

export function logger(isDebug?: boolean): Logger {
	return Logger.getInstance(isDebug);
}

export function log(message: string, object?: any): void {
	return Logger.getInstance().log(message, object);
}
