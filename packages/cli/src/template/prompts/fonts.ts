/**
 * Font selection prompts for template customization.
 * Restricts to ATS-safe fonts with proper fallback stacks.
 */

import { select } from '@inquirer/prompts';

import { ATS_SAFE_FONTS } from '../constants.ts';

/**
 * Prompt user to select heading font.
 * @returns Font stack string (e.g., "Arial, Helvetica, sans-serif")
 */
export async function selectHeadingFont(): Promise<string> {
	const choices = ATS_SAFE_FONTS.map((font) => ({
		value: font.value,
		name: font.name,
	}));

	return select({
		message: 'Select heading font:',
		choices,
		default: ATS_SAFE_FONTS[0]?.value,
	});
}

/**
 * Prompt user to select body text font.
 * @returns Font stack string (e.g., "Arial, Helvetica, sans-serif")
 */
export async function selectBodyFont(): Promise<string> {
	const choices = ATS_SAFE_FONTS.map((font) => ({
		value: font.value,
		name: font.name,
	}));

	return select({
		message: 'Select body font:',
		choices,
		default: ATS_SAFE_FONTS[0]?.value,
	});
}

/**
 * Combined font selection for heading and body.
 * Shows both prompts sequentially.
 * @returns Object with fontHeading and fontBody values
 */
export async function selectFonts(): Promise<{
	fontHeading: string;
	fontBody: string;
}> {
	const fontHeading = await selectHeadingFont();
	const fontBody = await selectBodyFont();

	return { fontHeading, fontBody };
}
