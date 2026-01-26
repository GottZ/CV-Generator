/**
 * Color selection prompts for template customization.
 * Provides preset colors and custom hex input with validation.
 */

import { isValidHexColor } from '@gottz/cv-templates';
import { input, select } from '@inquirer/prompts';

import { COLOR_PRESETS } from '../constants.ts';

/**
 * Prompt user to select accent color for template.
 * Offers preset colors or custom hex input.
 * @returns Selected hex color (e.g., "#2563eb")
 */
export async function selectAccentColor(): Promise<string> {
	// Build choices from presets plus custom option
	const choices = [
		...COLOR_PRESETS.map((preset) => ({
			value: preset.value,
			name: `${preset.name} ${preset.value}`,
		})),
		{ value: 'custom', name: 'Enter custom hex color...' },
	];

	const selection = await select({
		message: 'Select accent color:',
		choices,
		default: COLOR_PRESETS[0]?.value,
	});

	// Handle custom color input
	if (selection === 'custom') {
		return input({
			message: 'Enter hex color (e.g., #3b82f6):',
			validate: (value) => {
				const trimmed = value.trim();
				if (!trimmed) {
					return 'Color is required';
				}
				// Add # if missing
				const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
				if (!isValidHexColor(hex)) {
					return 'Please enter a valid hex color (e.g., #3b82f6)';
				}
				return true;
			},
			transformer: (value) => {
				// Normalize to include #
				const trimmed = value.trim();
				return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
			},
		});
	}

	return selection;
}
