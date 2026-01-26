/**
 * Regeneration module with similarity detection and history tracking.
 * Provides smart regeneration that increases variety when results are too similar.
 */

import { input, select } from '@inquirer/prompts';
import pc from 'picocolors';

/**
 * A single regeneration attempt with its parameters.
 */
export interface RegenerationAttempt {
	/** The generated text */
	text: string;
	/** Temperature used for generation */
	temperature: number;
}

/**
 * Options for regeneration with guidance.
 */
export interface RegenerateOptions {
	/** Original bullet text */
	original: string;
	/** Current AI suggestion */
	currentSuggestion: string;
	/** History of previous attempts */
	history: RegenerationAttempt[];
	/** Function to generate a new suggestion */
	generateFn: (guidance: string, temperature: number) => Promise<string>;
}

/**
 * Result of a regeneration operation.
 */
export interface RegenerateResult {
	/** The new suggestion */
	newSuggestion: string;
	/** Updated history including new attempt */
	history: RegenerationAttempt[];
}

/**
 * Calculate Jaccard similarity between two strings.
 * Uses word-level comparison (lowercase, split on whitespace).
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score from 0 to 1 (1 = identical)
 */
export function jaccardSimilarity(str1: string, str2: string): number {
	// Split into word sets (lowercase, whitespace split)
	const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
	const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));

	// Handle empty strings
	if (words1.size === 0 && words2.size === 0) {
		return 1;
	}
	if (words1.size === 0 || words2.size === 0) {
		return 0;
	}

	// Calculate intersection
	const intersection = new Set([...words1].filter((word) => words2.has(word)));

	// Calculate union
	const union = new Set([...words1, ...words2]);

	return intersection.size / union.size;
}

/**
 * Truncate text to a maximum length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Regenerate a suggestion with user guidance and similarity detection.
 * Prompts user for guidance, generates new content, and warns if too similar.
 *
 * @param options - Regeneration options
 * @returns New suggestion and updated history
 */
export async function regenerateWithGuidance(
	options: RegenerateOptions,
): Promise<RegenerateResult> {
	const { currentSuggestion: _, history, generateFn } = options;
	void _; // Original is available in options if needed for context

	// Prompt for guidance
	const guidance = await input({
		message: 'What would you like different?',
		default: '',
	});

	// Show example text
	console.log(
		pc.dim("(e.g., 'more specific metrics', 'focus on leadership', 'shorter')"),
	);

	// Calculate temperature: start at 0.7, bump by 0.1 per attempt (cap at 1.0)
	let temperature = Math.min(0.7 + history.length * 0.1, 1.0);

	// Generate new suggestion
	let newSuggestion = await generateFn(guidance, temperature);

	// Check similarity with previous attempt (if history exists)
	const lastAttempt = history.at(-1);
	if (lastAttempt) {
		const similarity = jaccardSimilarity(newSuggestion, lastAttempt.text);

		if (similarity > 0.8) {
			console.log(
				pc.yellow('Result similar to previous. Increasing variety...'),
			);
			// Auto-bump temperature by 0.1 (cap at 1.0)
			temperature = Math.min(temperature + 0.1, 1.0);
			// Regenerate with higher temperature
			newSuggestion = await generateFn(guidance, temperature);
		}
	}

	// Update history (keep last 5 attempts)
	const newHistory = [...history, { text: newSuggestion, temperature }].slice(
		-5,
	);

	return { newSuggestion, history: newHistory };
}

/** Special return value indicating user wants to regenerate again */
export const REGENERATE_SIGNAL = '__regenerate__';

/**
 * Allow user to select from regeneration history or regenerate again.
 * Displays numbered history with current marked.
 *
 * @param history - Previous regeneration attempts
 * @param current - Current suggestion text
 * @returns Selected text or REGENERATE_SIGNAL
 */
export async function selectFromHistory(
	history: RegenerationAttempt[],
	current: string,
): Promise<string> {
	// Build choices from history
	const choices = history.map((attempt, index) => {
		const isCurrent = attempt.text === current;
		const displayText = truncate(attempt.text, 60);
		const label = isCurrent
			? `${index + 1}. ${displayText} ${pc.cyan('<-- current')}`
			: `${index + 1}. ${displayText}`;

		return {
			name: label,
			value: attempt.text,
		};
	});

	// Add regenerate option
	choices.push({
		name: 'r. Regenerate again',
		value: REGENERATE_SIGNAL,
	});

	const selected = await select({
		message: 'Which version?',
		choices,
	});

	return selected;
}
