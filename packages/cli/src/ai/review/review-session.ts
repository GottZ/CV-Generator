/**
 * Review session orchestrator for AI suggestions.
 * Provides interactive one-at-a-time review with accept/edit/skip/regenerate actions.
 * Source: Phase 17 AI User Control (AI-11, AI-12, AI-13)
 */

import pc from 'picocolors';
import { displayComparison } from '../display/diff-display.js';
import { openInEditor } from './editor-integration.js';
import {
	type RegenerationAttempt,
	regenerateWithGuidance,
} from './regeneration.js';
import { promptReviewAction } from './review-prompt.js';
import {
	detectWeakness,
	displayWeakBulletWarning,
	type WeaknessType,
} from './weak-bullet-detector.js';

/**
 * A single item to review.
 */
export interface ReviewItem {
	/** Section name (e.g., "Experience: Senior Developer at Acme Corp") */
	section: string;
	/** Original bullet text */
	original: string;
	/** AI-suggested improvement */
	suggested: string;
	/** Pre-detected weakness type (optional, will be auto-detected if not provided) */
	weaknessType?: WeaknessType;
	/** Function to generate new suggestion (required for regeneration) */
	generateFn?: (guidance: string, temperature: number) => Promise<string>;
}

/**
 * Result of a review session.
 */
export interface ReviewState {
	/** Items accepted as-is (or with regenerated content) */
	accepted: ReviewItem[];
	/** Items skipped (keep original) */
	skipped: ReviewItem[];
	/** Items edited by user: original item -> edited content */
	edited: Map<ReviewItem, string>;
}

/**
 * Internal state for tracking regenerated suggestions.
 * Maps items to their current (possibly regenerated) suggestion.
 */
type RegeneratedSuggestions = Map<ReviewItem, string>;

/**
 * Get item at index, throwing if out of bounds.
 * This is a type guard that ensures the item is defined.
 */
function getItemAt(items: ReviewItem[], index: number): ReviewItem {
	const item = items[index];
	if (!item) {
		throw new Error(`Item at index ${index} is undefined`);
	}
	return item;
}

/**
 * Run an interactive review session for AI suggestions.
 * Processes items one at a time, allowing accept/edit/skip/regenerate actions.
 *
 * @param items - List of items to review
 * @returns Review state with accepted, skipped, and edited items
 */
export async function runReviewSession(
	items: ReviewItem[],
): Promise<ReviewState> {
	// Initialize state
	const state: ReviewState = {
		accepted: [],
		skipped: [],
		edited: new Map(),
	};

	// Track regeneration history per item
	const regenerationHistory = new Map<ReviewItem, RegenerationAttempt[]>();

	// Track regenerated suggestions (items may have updated suggestions)
	const regeneratedSuggestions: RegeneratedSuggestions = new Map();

	// Use while loop for regeneration (don't advance on regenerate)
	let i = 0;
	while (i < items.length) {
		const item = getItemAt(items, i);

		// Display context header
		console.log(`\n${pc.dim(`[${item.section}]`)} (${i + 1}/${items.length})`);

		// Check and display weakness warning
		const weakness = item.weaknessType ?? detectWeakness(item.original);
		if (weakness) {
			displayWeakBulletWarning(item.original, weakness);
		}

		// Get current suggestion (may have been regenerated)
		const currentSuggestion =
			regeneratedSuggestions.get(item) ?? item.suggested;

		// Display diff for AI-12 compliance (REQUIRED for every suggestion)
		console.log(displayComparison(item.original, currentSuggestion));

		// Prompt for action
		const action = await promptReviewAction({
			section: item.section,
			index: i + 1,
			total: items.length,
		});

		// Handle action
		switch (action) {
			case 'accept': {
				// Accept with current suggestion (may be regenerated)
				const acceptedItem = regeneratedSuggestions.has(item)
					? { ...item, suggested: currentSuggestion }
					: item;
				state.accepted.push(acceptedItem);
				i++;
				break;
			}

			case 'skip': {
				state.skipped.push(item);
				i++;
				break;
			}

			case 'edit': {
				const result = openInEditor(item.original, currentSuggestion);
				if (!result.cancelled && result.content) {
					state.edited.set(item, result.content);
				}
				// Move forward even if cancelled (user can go back if needed)
				i++;
				break;
			}

			case 'regenerate': {
				if (!item.generateFn) {
					console.log(pc.yellow('Regeneration not available for this item'));
					// Don't advance, let user choose another action
					continue;
				}

				// Get or initialize history for this item
				const history = regenerationHistory.get(item) ?? [];

				// Regenerate with guidance
				const { newSuggestion, history: newHistory } =
					await regenerateWithGuidance({
						original: item.original,
						currentSuggestion,
						history,
						generateFn: item.generateFn,
					});

				// Update history
				regenerationHistory.set(item, newHistory);

				// Update current suggestion
				regeneratedSuggestions.set(item, newSuggestion);

				// Don't increment i - stay on same item to review new suggestion
				break;
			}

			case 'accept_all': {
				// Accept all remaining items (including current)
				for (let j = i; j < items.length; j++) {
					const remainingItem = getItemAt(items, j);
					const suggestion =
						regeneratedSuggestions.get(remainingItem) ??
						remainingItem.suggested;
					const acceptedItem = regeneratedSuggestions.has(remainingItem)
						? { ...remainingItem, suggested: suggestion }
						: remainingItem;
					state.accepted.push(acceptedItem);
				}
				i = items.length; // Exit loop
				break;
			}

			case 'skip_all': {
				// Skip all remaining items (including current)
				for (let j = i; j < items.length; j++) {
					state.skipped.push(getItemAt(items, j));
				}
				i = items.length; // Exit loop
				break;
			}
		}
	}

	return state;
}
