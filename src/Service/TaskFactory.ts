import { moment } from "obsidian";
import { Task } from "../Model/Task";
import { TaskStatus } from "../Model/TaskStatus";
import { TaskDate } from "../Model/TaskDate";
import { Settings } from "../Settings";

export function createTaskFromLine(line: string, fileUri: string, dateOverride: Date | null, body: string, settings: Settings): Task | null {
	const taskRegex = /^(\s*[*+-]\s*\[)(.)(\]\s*)(.*)$/;
	const match = line.match(taskRegex);
	if (!match) return null;

	const statusChar = match[2];
	const status = (statusChar === "x" || statusChar === "X") ? TaskStatus.Done : TaskStatus.Todo;
	let summary = match[4].trim();

	// Remove bold and italic formatting from summary
	summary = summary.replace(/\*\*|__/g, "").replace(/\*|_/g, "");

	const dates: TaskDate[] = [];

	// Parse emoji-based dates (Tasks plugin style)
	const datePatterns = [
		{ name: "Due", emoji: "📅" },
		{ name: "Scheduled", emoji: "⏳" },
		{ name: "Start", emoji: "🛫" },
		{ name: "Completion", emoji: "✅" }
	];

	for (const pattern of datePatterns) {
		const regex = new RegExp(`${pattern.emoji}\\s*(\\d{4}-\\d{2}-\\d{2})`, "u");
		const dateMatch = summary.match(regex);
		if (dateMatch) {
			const date = moment(dateMatch[1], "YYYY-MM-DD").toDate();
			dates.push({ name: pattern.name, date });
			summary = summary.replace(dateMatch[0], "").trim();
		}
	}

	// Handle date override from Day Planner if applicable
	if (dateOverride) {
		dates.push({ name: "Due", date: dateOverride });
	}

	// Simple fallback: if no dates found but summary has YYYY-MM-DD
	if (dates.length === 0) {
		const genericDateMatch = summary.match(/(\d{4}-\d{2}-\d{2})/);
		if (genericDateMatch) {
			const date = moment(genericDateMatch[1], "YYYY-MM-DD").toDate();
			dates.push({ name: "Due", date });
			summary = summary.replace(genericDateMatch[0], "").trim();
		}
	}

	if (dates.length === 0) return null;

	return new Task(status, dates, summary, fileUri, body);
}
