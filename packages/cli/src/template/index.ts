/**
 * Template scaffolding module.
 * Exports for template copy, validation, and wizard operations.
 */

// Constants
export {
	ATS_SAFE_FONTS,
	COLOR_PRESETS,
	MARGIN_OPTIONS,
	RESERVED_TEMPLATE_IDS,
	validateTemplateId,
} from './constants.ts';

// Copier
export { copyTemplate, formatTemplateName } from './copier.ts';

// Types
export type {
	ColorPreset,
	CopyOptions,
	FontOption,
	SectionVisibility,
	StyleConfig,
	TemplateCustomization,
	TemplateWizardState,
	ValidationResult,
} from './types.ts';

// Validator
export { validateTemplate } from './validator.ts';
// Note: ValidationResult also exported from validator.ts but prefer types.ts export

// Prompts
export {
	selectAccentColor,
	selectBodyFont,
	selectFonts,
	selectHeadingFont,
	selectMargins,
	selectVisibleSections,
} from './prompts/index.ts';

// Note: wizard exports added by Plans 04-05
