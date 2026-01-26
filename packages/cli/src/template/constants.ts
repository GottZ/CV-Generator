/**
 * Template scaffolding constants.
 * Curated values for ATS-safe template customization.
 */

import type { ColorPreset, FontOption } from './types.ts';

/**
 * ATS-safe font options.
 * All fonts have proper fallback stacks for cross-platform compatibility.
 * Source: 20-RESEARCH.md - validated for ATS parsing (iCIMS, Workday, etc.)
 */
export const ATS_SAFE_FONTS: FontOption[] = [
	{ value: 'Arial, Helvetica, sans-serif', name: 'Arial (recommended)' },
	{ value: "'Times New Roman', Times, serif", name: 'Times New Roman' },
	{ value: 'Georgia, serif', name: 'Georgia' },
	{ value: 'Calibri, Helvetica, sans-serif', name: 'Calibri' },
	{ value: 'Verdana, sans-serif', name: 'Verdana' },
	{ value: "'Trebuchet MS', sans-serif", name: 'Trebuchet MS' },
	{ value: 'Tahoma, sans-serif', name: 'Tahoma' },
	{ value: 'Garamond, serif', name: 'Garamond' },
];

/**
 * Reserved template IDs that cannot be used for custom templates.
 * Includes built-in templates and internal directories.
 */
export const RESERVED_TEMPLATE_IDS = [
	'base',
	'modern',
	'classic',
	'minimal',
	'_shared',
] as const;

/**
 * Color presets for accent color selection.
 * Professional colors that work well in CV context.
 */
export const COLOR_PRESETS: ColorPreset[] = [
	{ value: '#2563eb', name: 'Blue (default)' },
	{ value: '#059669', name: 'Green' },
	{ value: '#7c3aed', name: 'Purple' },
	{ value: '#dc2626', name: 'Red' },
	{ value: '#0891b2', name: 'Teal' },
	{ value: '#ca8a04', name: 'Gold' },
	{ value: '#4f46e5', name: 'Indigo' },
	{ value: '#0f172a', name: 'Slate' },
];

/**
 * Margin options matching cv-templates named margins.
 */
export const MARGIN_OPTIONS = [
	{ value: 'narrow', name: 'Narrow (15mm) - More content space' },
	{ value: 'normal', name: 'Normal (20mm) - Balanced' },
	{ value: 'wide', name: 'Wide (30mm) - More whitespace' },
] as const;

/**
 * Validate template ID against reserved names.
 * @param id - Template ID to validate
 * @returns true if valid, error message string if invalid
 */
export function validateTemplateId(id: string): true | string {
	const normalized = id.toLowerCase().replace(/[^a-z0-9-]/g, '-');

	// Check reserved names
	if ((RESERVED_TEMPLATE_IDS as readonly string[]).includes(normalized)) {
		return `"${id}" is a reserved template name. Choose a different name.`;
	}

	// Check underscore prefix
	if (normalized.startsWith('_')) {
		return 'Template names cannot start with underscore';
	}

	// Check empty
	if (!normalized || normalized === '-') {
		return 'Template name is required';
	}

	// Check minimum length
	if (normalized.length < 2) {
		return 'Template name must be at least 2 characters';
	}

	return true;
}
