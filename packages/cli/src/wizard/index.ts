/**
 * Wizard module for interactive CV creation.
 * Exports types, state management, menu, and validation utilities.
 */

export type { MenuChoice } from './menu.ts';
// Menu navigation
export { formatMenuItem, selectMode, showMainMenu } from './menu.ts';

// State management
export {
	createInitialState,
	createStateFromExisting,
	getArrayCount,
	getSectionStatus,
	isMinimumViable,
	isSectionOptional,
} from './state.ts';

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
