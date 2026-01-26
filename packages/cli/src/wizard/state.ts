/**
 * Wizard state management.
 * Functions for creating, querying, and updating wizard state.
 */

import type { CVData } from '@gottz/cv-core';
import type {
	SectionStatus,
	WizardMode,
	WizardSection,
	WizardState,
} from './types.ts';

/**
 * Create initial empty wizard state.
 * @param mode - Wizard mode (quick or detailed)
 * @returns Fresh wizard state with empty sections
 */
export function createInitialState(mode: WizardMode): WizardState {
	return {
		contact: null,
		experience: [],
		education: [],
		skills: [],
		projects: [],
		certifications: [],
		mode,
		currentSection: null,
		validationIssues: new Map(),
		skippedFields: new Set(),
	};
}

/**
 * Create wizard state from existing CV data.
 * Used when editing an existing CV.
 * @param cv - Existing CV data
 * @param mode - Wizard mode (quick or detailed)
 * @param locale - Locale for localized sections (defaults to 'en')
 * @returns Wizard state pre-populated with existing data
 */
export function createStateFromExisting(
	cv: CVData,
	mode: WizardMode,
	locale: string = 'en',
): WizardState {
	return {
		contact: cv.contact,
		experience: cv.experience?.[locale] ?? [],
		education: cv.education?.[locale] ?? [],
		skills: cv.skills?.[locale] ?? [],
		projects: cv.projects?.[locale] ?? [],
		certifications: cv.certifications ?? [],
		mode,
		currentSection: null,
		validationIssues: new Map(),
		skippedFields: new Set(),
	};
}

/**
 * Get the completion status of a section.
 * @param state - Current wizard state
 * @param section - Section to check
 * @returns Section status for menu display
 */
export function getSectionStatus(
	state: WizardState,
	section: WizardSection,
): SectionStatus {
	switch (section) {
		case 'contact':
			if (!state.contact) return 'empty';
			// Contact is complete if name exists (only required field)
			// Consider partial if name exists but no other info
			if (!state.contact.name) return 'empty';
			if (
				!state.contact.email &&
				!state.contact.phone &&
				!state.contact.location
			) {
				return 'partial';
			}
			return 'complete';

		case 'experience':
			if (state.experience.length === 0) return 'empty';
			// Check if any experience entry has no bullets (partial)
			for (const exp of state.experience) {
				if (exp.bullets.length === 0) return 'partial';
			}
			return 'complete';

		case 'education':
			if (state.education.length === 0) return 'empty';
			// Education is complete if all entries have institution and degree
			for (const edu of state.education) {
				if (!edu.institution || !edu.degree) return 'partial';
			}
			return 'complete';

		case 'skills':
			if (state.skills.length === 0) return 'empty';
			// Skills is complete if at least one category has skills
			for (const category of state.skills) {
				if (category.skills.length > 0) return 'complete';
			}
			return 'partial';

		case 'projects':
			if (state.projects.length === 0) return 'empty';
			// Projects are complete if all have names
			for (const project of state.projects) {
				if (!project.name) return 'partial';
			}
			return 'complete';

		case 'certifications':
			if (state.certifications.length === 0) return 'empty';
			// Certifications are complete if all have name, issuer, and date
			for (const cert of state.certifications) {
				if (!cert.name || !cert.issuer || !cert.date) return 'partial';
			}
			return 'complete';
	}
}

/**
 * Check if the wizard state represents a minimum viable CV.
 * Per CONTEXT.md: "Minimum viable CV: contact info + at least one section"
 * @param state - Current wizard state
 * @returns true if CV has contact and at least one of (experience, education, skills)
 */
export function isMinimumViable(state: WizardState): boolean {
	// Must have contact with at least a name
	if (!state.contact || !state.contact.name) {
		return false;
	}

	// Must have at least one of: experience, education, or skills with content
	const hasExperience = state.experience.length > 0;
	const hasEducation = state.education.length > 0;
	const hasSkills =
		state.skills.length > 0 &&
		state.skills.some((cat) => cat.skills.length > 0);

	return hasExperience || hasEducation || hasSkills;
}

/**
 * Get the count of items in an array section.
 * @param state - Current wizard state
 * @param section - Section to count
 * @returns Number of items in the section (0 for contact)
 */
export function getArrayCount(
	state: WizardState,
	section: WizardSection,
): number {
	switch (section) {
		case 'contact':
			return 0; // Contact is not an array
		case 'experience':
			return state.experience.length;
		case 'education':
			return state.education.length;
		case 'skills':
			return state.skills.length;
		case 'projects':
			return state.projects.length;
		case 'certifications':
			return state.certifications.length;
	}
}

/**
 * Check if a section is optional.
 * @param section - Section to check
 * @returns true if the section is optional
 */
export function isSectionOptional(section: WizardSection): boolean {
	// Per CONTEXT.md: contact is required, experience/education/skills need at least one
	// Projects and certifications are optional
	switch (section) {
		case 'contact':
			return false; // Always required
		case 'experience':
		case 'education':
		case 'skills':
			// Partially required - need at least one of these
			return false;
		case 'projects':
		case 'certifications':
			return true;
	}
}
