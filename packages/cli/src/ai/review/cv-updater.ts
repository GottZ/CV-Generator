/**
 * CV content updater for applying reviewed changes.
 * Applies accepted and edited changes from review session to CV content.
 */

import type { ReviewState } from './review-session.js';

/**
 * A replacement to apply to the CV content.
 * Stores original text and its replacement.
 */
interface Replacement {
	original: string;
	replacement: string;
}

/**
 * Apply reviewed changes to CV content.
 * - Accepted items: replace original with suggested (or regenerated) text
 * - Edited items: replace original with user-edited text
 * - Skipped items: keep original text unchanged
 *
 * @param originalContent - The original CV markdown content
 * @param state - Review state with accepted, skipped, and edited items
 * @returns Modified content with accepted/edited changes applied
 */
export function applyReviewedChanges(
	originalContent: string,
	state: ReviewState,
): string {
	// Build replacement map
	const replacements: Replacement[] = [];

	// Add accepted items (use suggested, which may be regenerated)
	for (const item of state.accepted) {
		replacements.push({
			original: item.original,
			replacement: item.suggested,
		});
	}

	// Add edited items (use user-edited content)
	for (const [item, editedContent] of state.edited) {
		replacements.push({
			original: item.original,
			replacement: editedContent,
		});
	}

	// Sort by original length (longest first) to avoid partial matches
	// e.g., "Managed team" should be replaced before "Managed" if both exist
	replacements.sort((a, b) => b.original.length - a.original.length);

	// Apply replacements sequentially
	// Only replace first occurrence of each original to handle duplicates safely
	let result = originalContent;

	for (const { original, replacement } of replacements) {
		// Use indexOf for exact match and single replacement
		const index = result.indexOf(original);
		if (index !== -1) {
			result =
				result.slice(0, index) +
				replacement +
				result.slice(index + original.length);
		}
	}

	return result;
}
