/**
 * Wizard menu navigation.
 * Displays section progress with checkmark-style indicators.
 */

import { Separator, select } from '@inquirer/prompts';
import pc from 'picocolors';

import { getArrayCount, getSectionStatus, isSectionOptional } from './state.ts';
import type { SectionStatus, WizardMode, WizardState } from './types.ts';

/**
 * Menu choice value types.
 */
export type MenuChoice =
	| 'contact'
	| 'experience'
	| 'education'
	| 'skills'
	| 'projects'
	| 'certifications'
	| 'finish'
	| 'cancel';

/**
 * Format a menu item with status indicator and optional count.
 * Per CONTEXT.md checkmark style:
 * - complete: green checkmark
 * - partial: yellow half-circle
 * - empty + optional: dim circle
 * - empty + required: red X
 *
 * @param name - Section display name
 * @param status - Current section status
 * @param optional - Whether the section is optional
 * @param count - Number of items (for array sections)
 * @returns Formatted menu item string
 */
export function formatMenuItem(
	name: string,
	status: SectionStatus,
	optional: boolean,
	count?: number,
): string {
	let icon: string;
	switch (status) {
		case 'complete':
			icon = pc.green('\u2713'); // checkmark
			break;
		case 'partial':
			icon = pc.yellow('\u25D0'); // half circle
			break;
		case 'empty':
			icon = optional ? pc.dim('\u25CB') : pc.red('\u2717'); // circle or X
			break;
	}

	const countStr = count !== undefined && count > 0 ? ` (${count})` : '';
	const optStr = optional ? pc.dim(' (optional)') : '';

	return `${icon} ${name}${countStr}${optStr}`;
}

/**
 * Show the main wizard menu with section progress.
 * @param state - Current wizard state
 * @returns Selected menu action
 */
export async function showMainMenu(state: WizardState): Promise<MenuChoice> {
	// Build choices with status indicators
	const choices: Array<
		{ value: MenuChoice; name: string } | typeof Separator.prototype
	> = [
		{
			value: 'contact' as const,
			name: formatMenuItem(
				'Contact',
				getSectionStatus(state, 'contact'),
				isSectionOptional('contact'),
			),
		},
		{
			value: 'experience' as const,
			name: formatMenuItem(
				'Experience',
				getSectionStatus(state, 'experience'),
				isSectionOptional('experience'),
				getArrayCount(state, 'experience'),
			),
		},
		{
			value: 'education' as const,
			name: formatMenuItem(
				'Education',
				getSectionStatus(state, 'education'),
				isSectionOptional('education'),
				getArrayCount(state, 'education'),
			),
		},
		{
			value: 'skills' as const,
			name: formatMenuItem(
				'Skills',
				getSectionStatus(state, 'skills'),
				isSectionOptional('skills'),
				getArrayCount(state, 'skills'),
			),
		},
		{
			value: 'projects' as const,
			name: formatMenuItem(
				'Projects',
				getSectionStatus(state, 'projects'),
				isSectionOptional('projects'),
				getArrayCount(state, 'projects'),
			),
		},
		{
			value: 'certifications' as const,
			name: formatMenuItem(
				'Certifications',
				getSectionStatus(state, 'certifications'),
				isSectionOptional('certifications'),
				getArrayCount(state, 'certifications'),
			),
		},
		new Separator(),
		{
			value: 'finish' as const,
			name: 'Review & Save',
		},
		{
			value: 'cancel' as const,
			name: 'Cancel',
		},
	];

	return select({
		message: 'CV Wizard - Select section:',
		choices,
		loop: false, // No wrap-around in menu
	});
}

/**
 * Show mode selection at wizard start.
 * Per CONTEXT.md: "Quick/detailed mode offered at start"
 * @returns Selected wizard mode
 */
export async function selectMode(): Promise<WizardMode> {
	return select({
		message: 'Select wizard mode:',
		choices: [
			{
				value: 'quick' as const,
				name: 'Quick - Essential fields only (faster)',
			},
			{
				value: 'detailed' as const,
				name: 'Detailed - All fields (comprehensive)',
			},
		],
	});
}
