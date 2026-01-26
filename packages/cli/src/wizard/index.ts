/**
 * Wizard module for interactive CV creation.
 * Exports types, state management, menu, and validation utilities.
 */

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
