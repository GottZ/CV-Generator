/**
 * Wizard type definitions.
 * Types for interactive CV creation wizard state and flow control.
 */

import type {
	Certification,
	Contact,
	Education,
	Project,
	SkillCategory,
	WorkExperience,
} from '@gottz/cv-core';

/**
 * Wizard mode determines which fields are prompted.
 * - quick: Essential fields only (faster)
 * - detailed: All fields including optional ones (comprehensive)
 */
export type WizardMode = 'quick' | 'detailed';

/**
 * Section completion status for menu display.
 * - empty: No data entered
 * - partial: Some data but incomplete (e.g., experience with 0 bullets)
 * - complete: Section has valid, complete data
 */
export type SectionStatus = 'empty' | 'partial' | 'complete';

/**
 * CV sections that can be edited in the wizard.
 */
export type WizardSection =
	| 'contact'
	| 'experience'
	| 'education'
	| 'skills'
	| 'projects'
	| 'certifications';

/**
 * Result of field validation.
 */
export interface ValidationResult {
	/** Whether the value is valid */
	valid: boolean;
	/** Error message if invalid */
	error?: string;
	/** ATS warning (valid but may cause issues) */
	warning?: string;
}

/**
 * Complete wizard state tracking all CV sections.
 * Matches CVData structure but with null for empty contact
 * and explicit tracking of wizard-specific state.
 */
export interface WizardState {
	/** Contact information (null if not yet entered) */
	contact: Contact | null;
	/** Work experience entries */
	experience: WorkExperience[];
	/** Education entries */
	education: Education[];
	/** Skills by category */
	skills: SkillCategory[];
	/** Project entries */
	projects: Project[];
	/** Certification entries */
	certifications: Certification[];
	/** Current wizard mode */
	mode: WizardMode;
	/** Currently editing section (null if at menu) */
	currentSection: WizardSection | null;
	/** Validation issues by field path (e.g., "contact.email", "experience.0.bullets") */
	validationIssues: Map<string, string[]>;
	/** Fields explicitly skipped by user */
	skippedFields: Set<string>;
}
