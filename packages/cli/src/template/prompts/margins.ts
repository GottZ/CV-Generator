/**
 * Margin selection prompt for template customization.
 * Uses named sizes for simplicity, maps to mm values in cv-templates.
 */

import { select } from '@inquirer/prompts';

import { MARGIN_OPTIONS } from '../constants.ts';

/**
 * Prompt user to select page margins.
 * Uses named sizes that cv-templates resolves to mm values.
 * @returns Margin name ('narrow' | 'normal' | 'wide')
 */
export async function selectMargins(): Promise<'narrow' | 'normal' | 'wide'> {
	const choices = MARGIN_OPTIONS.map((opt) => ({
		value: opt.value,
		name: opt.name,
	}));

	return select({
		message: 'Select page margins:',
		choices,
		default: 'normal',
	}) as Promise<'narrow' | 'normal' | 'wide'>;
}
