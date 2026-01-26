/**
 * Flag collector for non-interactive wizard mode.
 * Gathers wizard state from CLI flag options.
 * Maps Commander.js options to partial WizardState.
 */

import type { WorkExperience } from '@gottz/cv-core';
import type { WizardState } from '../types.js';

/**
 * CLI flag options for wizard init command.
 * These map to Commander.js options.
 */
export interface InitFlagOptions {
	// Contact flags
	name?: string;
	email?: string;
	phone?: string;
	location?: string;
	// Simple link flags (for quick single-link add)
	linkedIn?: string;
	github?: string;
	website?: string;
}

/**
 * CLI flag options for add experience command.
 */
export interface AddExperienceFlagOptions {
	company?: string;
	role?: string;
	startDate?: string;
	endDate?: string;
	location?: string;
	bullets?: string[]; // Commander supports --bullet "x" --bullet "y"
	techStack?: string; // Comma-separated
}

/**
 * CLI flag options for add education command.
 */
export interface AddEducationFlagOptions {
	institution?: string;
	degree?: string;
	field?: string;
	startDate?: string;
	endDate?: string;
	location?: string;
	honors?: string;
	notes?: string;
}

/**
 * CLI flag options for add skills command.
 */
export interface AddSkillsFlagOptions {
	category?: string;
	skills?: string; // Comma-separated skill names
	levels?: string; // Comma-separated levels (parallel to skills)
}

/**
 * CLI flag options for add project command.
 */
export interface AddProjectFlagOptions {
	name?: string;
	description?: string;
	techStack?: string; // Comma-separated
	url?: string; // Primary URL
	urlType?: string; // Type for primary URL (github, demo, etc.)
	outcome?: string;
	role?: string;
	type?: 'personal' | 'professional' | 'open-source' | 'freelance';
	startDate?: string;
	endDate?: string;
	highlight?: boolean;
}

/**
 * CLI flag options for add certification command.
 */
export interface AddCertificationFlagOptions {
	name?: string;
	issuer?: string;
	date?: string;
	expiryDate?: string;
	verificationUrl?: string;
	credentialId?: string;
}

/**
 * Normalize URL by adding https:// if no protocol present.
 */
function normalizeUrl(url: string): string {
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	return `https://${url}`;
}

/**
 * Build partial wizard state from init flags.
 * Does NOT validate - validation happens at schema level.
 *
 * @param flags - CLI flag options from Commander.js
 * @returns Partial wizard state with contact info
 */
export function buildContactFromFlags(
	flags: InitFlagOptions,
): Partial<WizardState> {
	if (!flags.name) {
		return {};
	}

	const links: Array<{ type: string; url: string; label?: string }> = [];
	if (flags.linkedIn)
		links.push({ type: 'linkedin', url: normalizeUrl(flags.linkedIn) });
	if (flags.github)
		links.push({ type: 'github', url: normalizeUrl(flags.github) });
	if (flags.website)
		links.push({ type: 'website', url: normalizeUrl(flags.website) });

	return {
		contact: {
			name: flags.name,
			...(flags.email && { email: flags.email }),
			...(flags.phone && { phone: flags.phone }),
			...(flags.location && { location: flags.location }),
			...(links.length > 0 && { links }),
		},
	};
}

/**
 * Build single experience entry from flags.
 *
 * @param flags - CLI flag options for experience
 * @returns WorkExperience object or null if required fields missing
 */
export function buildExperienceFromFlags(
	flags: AddExperienceFlagOptions,
): WorkExperience | null {
	if (!flags.company || !flags.role || !flags.startDate) {
		return null;
	}

	return {
		company: flags.company,
		role: flags.role,
		startDate: flags.startDate,
		endDate: flags.endDate ?? 'present',
		...(flags.location && { location: flags.location }),
		bullets: flags.bullets ?? [],
		...(flags.techStack && {
			techStack: flags.techStack.split(',').map((t) => t.trim()),
		}),
	};
}

/**
 * Build single education entry from flags.
 *
 * @param flags - CLI flag options for education
 * @returns Education object or null if required fields missing
 */
export function buildEducationFromFlags(flags: AddEducationFlagOptions): {
	institution: string;
	degree: string;
	field?: string;
	startDate: string;
	endDate: string;
	location?: string;
	honors?: string;
	notes?: string;
} | null {
	if (
		!flags.institution ||
		!flags.degree ||
		!flags.startDate ||
		!flags.endDate
	) {
		return null;
	}

	return {
		institution: flags.institution,
		degree: flags.degree,
		...(flags.field && { field: flags.field }),
		startDate: flags.startDate,
		endDate: flags.endDate,
		...(flags.location && { location: flags.location }),
		...(flags.honors && { honors: flags.honors }),
		...(flags.notes && { notes: flags.notes }),
	};
}

/**
 * Build skills category from flags.
 *
 * @param flags - CLI flag options for skills
 * @returns SkillCategory object or null if required fields missing
 */
export function buildSkillsFromFlags(flags: AddSkillsFlagOptions): {
	name: string;
	skills: Array<{ name: string; level?: string }>;
} | null {
	if (!flags.category || !flags.skills) {
		return null;
	}

	const skillNames = flags.skills.split(',').map((s) => s.trim());
	const levels = flags.levels?.split(',').map((l) => l.trim()) ?? [];

	const skills = skillNames.map((name, index) => ({
		name,
		...(levels[index] && { level: levels[index] }),
	}));

	return {
		name: flags.category,
		skills,
	};
}

/**
 * Build single project entry from flags.
 *
 * @param flags - CLI flag options for project
 * @returns Project object or null if required fields missing
 */
export function buildProjectFromFlags(flags: AddProjectFlagOptions): {
	name: string;
	description?: string;
	techStack?: string[];
	links?: Array<{ url: string; type?: string; label?: string }>;
	outcome?: string;
	role?: string;
	type?: 'personal' | 'professional' | 'open-source' | 'freelance';
	startDate?: string;
	endDate?: string;
	highlight?: boolean;
} | null {
	if (!flags.name) {
		return null;
	}

	const links: Array<{ url: string; type?: string; label?: string }> = [];
	if (flags.url) {
		links.push({
			url: normalizeUrl(flags.url),
			...(flags.urlType && { type: flags.urlType }),
		});
	}

	return {
		name: flags.name,
		...(flags.description && { description: flags.description }),
		...(flags.techStack && {
			techStack: flags.techStack.split(',').map((t) => t.trim()),
		}),
		...(links.length > 0 && { links }),
		...(flags.outcome && { outcome: flags.outcome }),
		...(flags.role && { role: flags.role }),
		...(flags.type && { type: flags.type }),
		...(flags.startDate && { startDate: flags.startDate }),
		...(flags.endDate && { endDate: flags.endDate }),
		...(flags.highlight !== undefined && { highlight: flags.highlight }),
	};
}

/**
 * Build single certification entry from flags.
 *
 * @param flags - CLI flag options for certification
 * @returns Certification object or null if required fields missing
 */
export function buildCertificationFromFlags(
	flags: AddCertificationFlagOptions,
): {
	name: string;
	issuer: string;
	date: string;
	expiryDate?: string;
	verificationUrl?: string;
	credentialId?: string;
} | null {
	if (!flags.name || !flags.issuer || !flags.date) {
		return null;
	}

	return {
		name: flags.name,
		issuer: flags.issuer,
		date: flags.date,
		...(flags.expiryDate && { expiryDate: flags.expiryDate }),
		...(flags.verificationUrl && {
			verificationUrl: normalizeUrl(flags.verificationUrl),
		}),
		...(flags.credentialId && { credentialId: flags.credentialId }),
	};
}
