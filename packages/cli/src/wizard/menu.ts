/**
 * Wizard menu navigation.
 * Displays section progress with checkmark-style indicators.
 */

import { input, Separator, select } from '@inquirer/prompts';
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

/**
 * Locale options for CV language selection.
 */
const LOCALE_CHOICES = [
	{ value: 'en', name: 'English' },
	{ value: 'de', name: 'German (Deutsch)' },
	{ value: 'fr', name: 'French (Fran\u00E7ais)' },
	{ value: 'es', name: 'Spanish (Espa\u00F1ol)' },
	{ value: 'custom', name: 'Other...' },
] as const;

/**
 * Prompt user to select the CV language/locale.
 * Per CONTEXT.md: "Wizard prompts for locale at start"
 * @returns Selected locale code (e.g., 'en', 'de', or custom code)
 */
export async function selectLocale(): Promise<string> {
	const selection = await select({
		message: 'What language will this CV be in?',
		choices: LOCALE_CHOICES,
		default: 'en',
	});

	if (selection === 'custom') {
		const customLocale = await input({
			message: 'Enter locale code (e.g., pt, it, nl):',
			validate: (value) => {
				const trimmed = value.trim();
				if (!trimmed) return 'Locale code is required';
				if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(trimmed)) {
					return 'Please enter a valid locale code (e.g., pt, it, nl, or pt-BR)';
				}
				return true;
			},
		});
		return customLocale.trim();
	}

	return selection;
}
