
export interface HeadingReference {
	heading: string;
	position: {
		start: {
			line: number;
		};
	};
}

export class HeadingsHelper {
	constructor(private readonly headings: HeadingReference[]) {}

	public resolveDateForLine(lineNumber: number): Date | null {
		let closestHeading: HeadingReference | null = null;

		for (const heading of this.headings) {
			if (heading.position.start.line < lineNumber) {
				closestHeading = heading;
			} else {
				break;
			}
		}

		if (!closestHeading) return null;

		const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
		const match = closestHeading.heading.match(dateRegex);
		
		if (match) {
			return new Date(`${match[1]}T00:00:00`);
		}

		return null;
	}
}
