/**
 * State builder for non-interactive wizard mode.
 * Builds wizard state from JSON input and/or CLI flags with conflict detection.
 */

import { createInitialState } from '../state.js';
import type { WizardState } from '../types.js';
import {
	buildContactFromFlags,
	type InitFlagOptions,
} from './flag-collector.js';
import { exitWithError } from './output-formatter.js';
import {
	type ContactInput,
	normalizeBullet,
	validateWizardInput,
	type WizardInitInput,
	WizardInitInputSchema,
} from './schemas.js';

/**
 * Conflict between JSON and flag values.
 */
export interface ConflictDetails {
	field: string;
	flagValue: unknown;
	jsonValue: unknown;
}

/**
 * Detect conflicts between JSON data and CLI flags.
 * Per CONTEXT.md: error if both provide same field with different values.
 *
 * Only checks top-level contact fields (name, email, phone, location).
 * Nested structures like links/experience are not compared since they
 * can only come from JSON (flags don't support arrays).
 *
 * @param jsonData - Parsed JSON input data
 * @param flags - CLI flag options
 * @returns Array of conflict descriptions
 */
export function detectConflicts(
	jsonData: Record<string, unknown> | undefined,
	flags: InitFlagOptions,
): ConflictDetails[] {
	const conflicts: ConflictDetails[] = [];
	if (!jsonData) return conflicts;

	// Get contact from JSON if present
	const jsonContact = jsonData.contact as ContactInput | undefined;
	if (!jsonContact) return conflicts;

	// Check each flag that might conflict with JSON contact
	const flagsToCheck: Array<{
		flag: keyof InitFlagOptions;
		jsonField: keyof ContactInput;
	}> = [
		{ flag: 'name', jsonField: 'name' },
		{ flag: 'email', jsonField: 'email' },
		{ flag: 'phone', jsonField: 'phone' },
		{ flag: 'location', jsonField: 'location' },
	];

	for (const { flag, jsonField } of flagsToCheck) {
		const flagValue = flags[flag];
		const jsonValue = jsonContact[jsonField];

		if (flagValue !== undefined && jsonValue !== undefined) {
			if (flagValue !== jsonValue) {
				conflicts.push({
					field: jsonField,
					flagValue,
					jsonValue,
				});
			}
		}
	}

	return conflicts;
}

/**
 * Format conflict details for error output.
 */
function formatConflicts(conflicts: ConflictDetails[]): string[] {
	return conflicts.map(
		(c) =>
			`${c.field}: flag="${String(c.flagValue)}" vs json="${String(c.jsonValue)}"`,
	);
}

/**
 * Build wizard state from JSON input and/or flags.
 *
 * Priority per CONTEXT.md:
 * 1. Detect conflicts (error if found)
 * 2. JSON takes precedence for complex data (arrays, objects)
 * 3. Flags can supplement JSON data
 *
 * @param jsonData - Raw JSON data (will be validated)
 * @param flags - CLI flag options
 * @param jsonMode - Whether output should be JSON formatted
 * @returns Valid WizardState
 * @throws Exits process with error if validation fails or conflicts detected
 */
export function buildWizardState(
	jsonData: unknown | undefined,
	flags: InitFlagOptions,
	jsonMode: boolean,
): WizardState {
	// Check for conflicts first (before validation)
	if (jsonData && typeof jsonData === 'object') {
		const conflicts = detectConflicts(
			jsonData as Record<string, unknown>,
			flags,
		);
		if (conflicts.length > 0) {
			exitWithError(
				'Conflicting values between flags and JSON input',
				{
					conflicts: formatConflicts(conflicts),
					code: 'CONFLICT_ERROR',
					suggestions: [
						'Use either --json-input OR flags, not both for the same fields',
						'Remove conflicting flags when providing JSON input',
					],
				},
				jsonMode,
				'VALIDATION_ERROR',
			);
		}
	}

	// Start with initial state (quick mode for non-interactive)
	const state = createInitialState('quick');

	// Apply JSON data if present
	if (jsonData) {
		const validated = validateWizardInput(
			WizardInitInputSchema,
			jsonData,
			jsonMode,
		);

		applyValidatedJsonToState(state, validated);
	}

	// Apply flags (only if JSON didn't provide the data)
	const flagState = buildContactFromFlags(flags);
	if (!state.contact && flagState.contact) {
		state.contact = flagState.contact;
	}

	return state;
}

/**
 * Apply validated JSON data to wizard state.
 * Handles STAR bullet conversion and section mapping.
 *
 * @param state - Wizard state to mutate
 * @param validated - Validated JSON input
 */
function applyValidatedJsonToState(
	state: WizardState,
	validated: WizardInitInput,
): void {
	// Apply contact
	state.contact = validated.contact;

	// Apply experience with STAR bullet normalization
	if (validated.experience) {
		state.experience = validated.experience.map((exp) => ({
			company: exp.company,
			role: exp.role,
			startDate: exp.startDate,
			endDate: exp.endDate,
			...(exp.location && { location: exp.location }),
			bullets: exp.bullets.map((b) => normalizeBullet(b)),
			...(exp.techStack && { techStack: exp.techStack }),
		}));
	}

	// Apply education
	if (validated.education) {
		state.education = validated.education.map((edu) => ({
			institution: edu.institution,
			degree: edu.degree,
			...(edu.field && { field: edu.field }),
			startDate: edu.startDate,
			endDate: edu.endDate,
			...(edu.location && { location: edu.location }),
			...(edu.honors && { honors: edu.honors }),
			...(edu.notes && { notes: edu.notes }),
		}));
	}

	// Apply skills
	if (validated.skills) {
		state.skills = validated.skills.map((cat) => ({
			name: cat.name,
			skills: cat.skills.map((s) => ({
				name: s.name,
				...(s.level && { level: s.level }),
			})),
		}));
	}

	// Apply projects
	if (validated.projects) {
		state.projects = validated.projects.map((proj) => ({
			name: proj.name,
			...(proj.description && { description: proj.description }),
			...(proj.techStack && { techStack: proj.techStack }),
			...(proj.links && { links: proj.links }),
			...(proj.outcome && { outcome: proj.outcome }),
			...(proj.role && { role: proj.role }),
			...(proj.type && { type: proj.type }),
			...(proj.startDate && { startDate: proj.startDate }),
			...(proj.endDate && { endDate: proj.endDate }),
			...(proj.highlight !== undefined && { highlight: proj.highlight }),
		}));
	}

	// Apply certifications
	if (validated.certifications) {
		state.certifications = validated.certifications.map((cert) => ({
			name: cert.name,
			issuer: cert.issuer,
			date: cert.date,
			...(cert.expiryDate && { expiryDate: cert.expiryDate }),
			...(cert.verificationUrl && { verificationUrl: cert.verificationUrl }),
			...(cert.credentialId && { credentialId: cert.credentialId }),
		}));
	}
}

/**
 * Merge contact from flags into existing state contact.
 * Used when flags should supplement (not replace) JSON data.
 *
 * @param state - Wizard state with contact from JSON
 * @param flags - CLI flags that might have additional fields
 */
export function mergeContactFlags(
	state: WizardState,
	flags: InitFlagOptions,
): void {
	if (!state.contact) return;

	// Only fill in fields that are missing from JSON
	if (!state.contact.email && flags.email) {
		state.contact.email = flags.email;
	}
	if (!state.contact.phone && flags.phone) {
		state.contact.phone = flags.phone;
	}
	if (!state.contact.location && flags.location) {
		state.contact.location = flags.location;
	}

	// Links are trickier - we could append from flags if JSON has none
	// For now, don't merge links (JSON takes full precedence for arrays)
}

/**
 * Check if wizard state has minimum required data.
 *
 * @param state - Wizard state to check
 * @returns true if contact.name exists (minimum for valid CV)
 */
export function hasMinimumData(state: WizardState): boolean {
	return state.contact !== null && state.contact.name.length > 0;
}
