/**
 * Section visibility prompt for template customization.
 * Allows users to show/hide optional CV sections.
 */

import { checkbox } from '@inquirer/prompts';

import type { SectionVisibility } from '../types.ts';

/**
 * Section options for visibility selection.
 * Only includes truly optional sections.
 */
const SECTION_OPTIONS = [
	{ value: 'summary', name: 'Summary', checked: true },
	{ value: 'projects', name: 'Projects', checked: true },
	{ value: 'certifications', name: 'Certifications', checked: true },
] as const;

/**
 * Prompt user to select which optional sections to show.
 * Experience, Education, and Skills are always shown (required for ATS).
 * @returns SectionVisibility configuration
 */
export async function selectVisibleSections(): Promise<SectionVisibility> {
	const selections = await checkbox({
		message:
			'Select sections to show (Experience, Education, Skills always shown):',
		choices: SECTION_OPTIONS.map((opt) => ({
			value: opt.value,
			name: opt.name,
			checked: opt.checked,
		})),
	});

	return {
		showSummary: selections.includes('summary'),
		showProjects: selections.includes('projects'),
		showCertifications: selections.includes('certifications'),
	};
}
