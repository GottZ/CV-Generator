/**
 * Side-by-side and inline diff display for content comparison.
 * Source: RESEARCH.md Pattern 6
 */

import { diffWords } from 'diff';
import pc from 'picocolors';

/**
 * Display comparison based on terminal width.
 * >= 120 columns: side-by-side
 * < 120 columns: inline diff
 */
export function displayComparison(
	original: string,
	improved: string,
	terminalWidth?: number,
): string {
	const width = terminalWidth ?? getTerminalWidth();
	if (width >= 120) {
		return displaySideBySide(original, improved, width);
	}
	return displayInlineDiff(original, improved);
}

/**
 * Display original and improved text side by side in columns.
 * Headers: "Original" | "Improved"
 * Uses dim separators for visual clarity.
 */
export function displaySideBySide(
	original: string,
	improved: string,
	width: number,
): string {
	// Calculate column width (half of terminal minus separator " | ")
	const colWidth = Math.floor((width - 3) / 2);
	const originalLines = wrapText(original, colWidth);
	const improvedLines = wrapText(improved, colWidth);
	const maxLines = Math.max(originalLines.length, improvedLines.length);

	const lines: string[] = [];

	// Header separators
	lines.push(
		pc.dim('\u2500'.repeat(colWidth)) +
			' \u2502 ' +
			pc.dim('\u2500'.repeat(colWidth)),
	);
	lines.push(
		`${padRight(pc.bold('Original'), colWidth)} \u2502 ${pc.bold('Improved')}`,
	);
	lines.push(
		pc.dim('\u2500'.repeat(colWidth)) +
			' \u2502 ' +
			pc.dim('\u2500'.repeat(colWidth)),
	);

	// Content lines
	for (let i = 0; i < maxLines; i++) {
		const left = originalLines[i] || '';
		const right = improvedLines[i] || '';
		lines.push(`${padRight(left, colWidth)} \u2502 ${right}`);
	}

	return lines.join('\n');
}

/**
 * Display inline diff with color-coded additions and removals.
 * Green + bold for additions.
 * Red + strikethrough for removals.
 * Plain for unchanged.
 */
export function displayInlineDiff(original: string, improved: string): string {
	const diff = diffWords(original, improved);

	return diff
		.map((part) => {
			if (part.added) {
				return pc.green(pc.bold(part.value));
			}
			if (part.removed) {
				return pc.red(pc.strikethrough(part.value));
			}
			return part.value;
		})
		.join('');
}

/**
 * Get terminal width with fallback for non-TTY environments.
 */
function getTerminalWidth(): number {
	return process.stdout.columns || 80;
}

/**
 * Word-wrap text to fit within a specified width.
 * Preserves word boundaries when possible.
 */
function wrapText(text: string, width: number): string[] {
	const lines: string[] = [];
	const words = text.split(/\s+/);
	let currentLine = '';

	for (const word of words) {
		if (!word) continue;

		// If word itself is longer than width, break it
		if (word.length > width) {
			if (currentLine) {
				lines.push(currentLine);
				currentLine = '';
			}
			// Break long word into chunks
			for (let i = 0; i < word.length; i += width) {
				lines.push(word.slice(i, i + width));
			}
			continue;
		}

		// Check if adding word would exceed width
		const separator = currentLine ? ' ' : '';
		if (currentLine.length + separator.length + word.length <= width) {
			currentLine += separator + word;
		} else {
			if (currentLine) {
				lines.push(currentLine);
			}
			currentLine = word;
		}
	}

	// Don't forget the last line
	if (currentLine) {
		lines.push(currentLine);
	}

	// Ensure at least one empty line if text is empty
	if (lines.length === 0) {
		lines.push('');
	}

	return lines;
}

/**
 * Pad string to specified width with spaces on the right.
 * Handles ANSI escape codes by measuring visible length.
 */
function padRight(text: string, width: number): string {
	// Strip ANSI codes for length calculation
	const visibleLength = stripAnsi(text).length;
	const padding = Math.max(0, width - visibleLength);
	return text + ' '.repeat(padding);
}

/**
 * Strip ANSI escape codes from a string.
 * Uses biome-ignore to allow control character in regex for ANSI stripping.
 */
function stripAnsi(text: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
	return text.replace(/\x1B\[[0-9;]*m/g, '');
}
