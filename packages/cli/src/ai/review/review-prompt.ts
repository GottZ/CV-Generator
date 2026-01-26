/**
 * Interactive review prompt for AI suggestions.
 * Provides git-add-p style single-key actions for accept/edit/skip/regenerate.
 * Source: Phase 17 AI User Control (AI-11, AI-13)
 */

import { expand } from '@inquirer/prompts';

/**
 * Review action types for AI suggestions.
 */
export type ReviewAction =
	| 'accept'
	| 'edit'
	| 'skip'
	| 'regenerate'
	| 'accept_all'
	| 'skip_all';

/**
 * Context for review prompt display.
 */
export interface ReviewContext {
	section: string;
	index: number;
	total: number;
}

/**
 * Prompt user for review action on a single suggestion.
 * Uses expand prompt for git-add-p style single-key interaction.
 *
 * Keys:
 * - a: Accept this suggestion
 * - e: Edit in $EDITOR
 * - s: Skip (keep original)
 * - r: Regenerate with guidance
 * - y: Accept ALL remaining (yes to all)
 * - n: Skip ALL remaining (no to all)
 * - h: Show help (automatic)
 */
export async function promptReviewAction(
	context: ReviewContext,
): Promise<ReviewAction> {
	const { section, index, total } = context;
	const progress = `[${index}/${total}]`;

	const action = await expand<ReviewAction>({
		message: `${progress} ${section}`,
		default: 'a',
		choices: [
			{
				key: 'a',
				name: 'Accept this suggestion',
				value: 'accept',
			},
			{
				key: 'e',
				name: 'Edit in $EDITOR',
				value: 'edit',
			},
			{
				key: 's',
				name: 'Skip (keep original)',
				value: 'skip',
			},
			{
				key: 'r',
				name: 'Regenerate with guidance',
				value: 'regenerate',
			},
			{
				key: 'y',
				name: 'Accept ALL remaining (yes to all)',
				value: 'accept_all',
			},
			{
				key: 'n',
				name: 'Skip ALL remaining (no to all)',
				value: 'skip_all',
			},
		],
	});

	return action;
}
