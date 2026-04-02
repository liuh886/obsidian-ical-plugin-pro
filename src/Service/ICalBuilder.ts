export class ICalBuilder {
	private lines: string[] = [];

	constructor() {
		this.lines.push("BEGIN:VCALENDAR");
		this.lines.push("VERSION:2.0");
		this.lines.push("PRODID:-//liuh886//obsidian-ical-plugin-pro v2.1.0//EN");
		this.lines.push("CALSCALE:GREGORIAN");
	}

	public setCalendarName(name: string): this {
		this.lines.push(`X-WR-CALNAME:${this.escapeText(name)}`);
		this.lines.push(`NAME:${this.escapeText(name)}`);
		return this;
	}

	public setTimezone(tz: string): this {
		this.lines.push(`X-WR-TIMEZONE:${tz}`);
		return this;
	}

	public setLastUpdated(date: Date): this {
		const formattedDate = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
		this.lines.push(`X-WR-DATE:${formattedDate}`);
		this.lines.push(`X-WR-CALDESC:Last updated at ${date.toLocaleString()}`);
		return this;
	}

	public setRefreshInterval(minutes: number): this {
		this.lines.push(`X-PUBLISHED-TTL:PT${minutes}M`);
		this.lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${minutes}M`);
		return this;
	}

	public addProperty(key: string, value: string): this {
		this.lines.push(`${key}:${this.escapeText(value)}`);
		return this;
	}

	public beginEvent(): this {
		this.lines.push("BEGIN:VEVENT");
		return this;
	}

	public endEvent(): this {
		this.lines.push("END:VEVENT");
		return this;
	}

	public beginToDo(): this {
		this.lines.push("BEGIN:VTODO");
		return this;
	}

	public endToDo(): this {
		this.lines.push("END:VTODO");
		return this;
	}

	public addEventProperty(key: string, value: string, escape = true): this {
		const escapedValue = escape ? this.escapeText(value) : value;
		this.lines.push(`${key}:${escapedValue}`);
		return this;
	}

	public build(): string {
		this.lines.push("END:VCALENDAR");
		return this.lines.map((line) => this.foldLine(line)).join("\r\n") + "\r\n";
	}

	private escapeText(text: string): string {
		return text
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "");
	}

	private foldLine(line: string): string {
		if (line.length <= 75) return line;

		let result = "";
		let currentLine = line;

		while (currentLine.length > 75) {
			result += currentLine.substring(0, 75) + "\r\n ";
			currentLine = currentLine.substring(75);
		}
		result += currentLine;
		return result;
	}
}
