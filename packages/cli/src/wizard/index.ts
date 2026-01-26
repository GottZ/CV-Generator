/**
 * Wizard module for interactive CV creation.
 * Exports types, state management, menu, and validation utilities.
 */

// Markdown writer
export { generateMarkdown, writeWizardOutput } from './markdown-writer.ts';
export type { MenuChoice } from './menu.ts';
// Menu navigation
export { formatMenuItem, selectMode, showMainMenu } from './menu.ts';
// Runner - wizard orchestration
export type { WizardOptions } from './runner.ts';
export { runAddSection, runWizard } from './runner.ts';
// State management
export {
	createInitialState,
	createStateFromExisting,
	getArrayCount,
	getSectionStatus,
	isMinimumViable,
	isSectionOptional,
} from './state.ts';
// Summary display
export { confirmSave, displaySummary, formatInlineIssue } from './summary.ts';
// Types
export type {
	SectionStatus,
	ValidationResult,
	WizardMode,
	WizardSection,
	WizardState,
} from './types.ts';
export type { ValidatingInputConfig } from './validation.ts';
// Validation
export {
	createValidatingInput,
	validateDate,
	validateEmail,
	validateRequired,
} from './validation.ts';
