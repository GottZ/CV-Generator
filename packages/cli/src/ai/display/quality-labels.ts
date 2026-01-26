/**
 * Traffic light quality labels for generated content.
 * Source: RESEARCH.md "Quality Labels" code example
 */

import pc from 'picocolors';

export type Quality = 'strong' | 'good' | 'needs_review';

/**
 * Format quality label with appropriate color.
 * Strong = green, Good = yellow, Needs Review = red
 */
export function formatQualityLabel(quality: Quality): string {
	switch (quality) {
		case 'strong':
			return pc.green('Strong');
		case 'good':
			return pc.yellow('Good');
		case 'needs_review':
			return pc.red('Needs Review');
	}
}

/**
 * Format keyword coverage score with color.
 * >= 80% = green, >= 50% = yellow, < 50% = red
 */
export function formatKeywordScore(score: number): string {
	const percentage = Math.round(score);
	const color =
		percentage >= 80 ? pc.green : percentage >= 50 ? pc.yellow : pc.red;
	return color(`${percentage}%`);
}

/**
 * Format match score with color (for tailor command).
 * >= 75% = green, >= 50% = yellow, < 50% = red
 */
export function formatMatchScore(score: number): string {
	const percentage = Math.round(score);
	const color =
		percentage >= 75 ? pc.green : percentage >= 50 ? pc.yellow : pc.red;
	return color(`${percentage}%`);
}

/**
 * Format priority level.
 * High = red + bold, Medium = yellow, Low = dim
 */
export function formatPriority(priority: 'high' | 'medium' | 'low'): string {
	switch (priority) {
		case 'high':
			return pc.red(pc.bold('High'));
		case 'medium':
			return pc.yellow('Medium');
		case 'low':
			return pc.dim('Low');
	}
}
