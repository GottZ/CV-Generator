/**
 * Summary display for wizard pre-commit review.
 * Displays structured preview of all entered data with inline validation issues.
 * Implements WIZ-10: Review summary before saving.
 */

import { select } from '@inquirer/prompts';
import pc from 'picocolors';
import type { WizardState } from './types.ts';

/**
 * Format a validation issue for inline display.
 * @param issue - The validation issue message
 * @returns Formatted issue string with warning indicator
 */
export function formatInlineIssue(issue: string): string {
	return pc.yellow(`  \u26a0 ${issue}`);
}

/**
 * Get validation issues for a specific field path.
 * @param state - Current wizard state
 * @param fieldPath - Field path (e.g., "contact.email", "experience.0.bullets")
 * @returns Array of issue strings for that field
 */
function getFieldIssues(state: WizardState, fieldPath: string): string[] {
	return state.validationIssues.get(fieldPath) ?? [];
}

/**
 * Display a formatted summary of all CV sections.
 * Shows validation issues inline next to relevant fields.
 * @param state - Current wizard state
 */
export function displaySummary(state: WizardState): void {
	console.log(pc.bold('\n=== CV Summary ===\n'));

	// Contact section
	console.log(pc.cyan('Contact Information'));
	if (state.contact) {
		console.log(`  Name: ${state.contact.name}`);

		// Email
		if (state.contact.email) {
			console.log(`  Email: ${state.contact.email}`);
		} else {
			console.log(`  Email: ${pc.dim('(not set)')}`);
		}
		for (const issue of getFieldIssues(state, 'contact.email')) {
			console.log(formatInlineIssue(issue));
		}

		// Phone
		if (state.contact.phone) {
			console.log(`  Phone: ${state.contact.phone}`);
		} else {
			console.log(`  Phone: ${pc.dim('(not set)')}`);
		}
		for (const issue of getFieldIssues(state, 'contact.phone')) {
			console.log(formatInlineIssue(issue));
		}

		// Location
		if (state.contact.location) {
			console.log(`  Location: ${state.contact.location}`);
		} else {
			console.log(`  Location: ${pc.dim('(not set)')}`);
		}
		for (const issue of getFieldIssues(state, 'contact.location')) {
			console.log(formatInlineIssue(issue));
		}

		// Links
		if (state.contact.links && state.contact.links.length > 0) {
			console.log('  Links:');
			for (const link of state.contact.links) {
				const label = link.label ?? link.type;
				console.log(`    - ${label}: ${link.url}`);
			}
		} else {
			console.log(`  Links: ${pc.dim('(none)')}`);
		}
		for (const issue of getFieldIssues(state, 'contact.links')) {
			console.log(formatInlineIssue(issue));
		}
	} else {
		console.log(pc.dim('  (not entered)'));
	}

	// Experience section
	console.log(pc.cyan(`\nWork Experience (${state.experience.length})`));
	if (state.experience.length > 0) {
		for (let i = 0; i < state.experience.length; i++) {
			const exp = state.experience[i];
			if (!exp) continue;
			const dateRange = `${exp.startDate} - ${exp.endDate}`;
			const bulletCount = exp.bullets.length;
			console.log(`  ${exp.role} at ${exp.company}`);
			console.log(pc.dim(`    ${dateRange} | ${bulletCount} bullet(s)`));

			// Show validation issues for this experience entry
			for (const issue of getFieldIssues(state, `experience.${i}`)) {
				console.log(formatInlineIssue(issue));
			}
			for (const issue of getFieldIssues(state, `experience.${i}.bullets`)) {
				console.log(formatInlineIssue(issue));
			}
		}
	} else {
		console.log(pc.dim('  (none)'));
	}

	// Education section
	console.log(pc.cyan(`\nEducation (${state.education.length})`));
	if (state.education.length > 0) {
		for (let i = 0; i < state.education.length; i++) {
			const edu = state.education[i];
			if (!edu) continue;
			const dateRange = `${edu.startDate} - ${edu.endDate}`;
			console.log(`  ${edu.degree} at ${edu.institution}`);
			console.log(pc.dim(`    ${dateRange}`));

			// Show validation issues for this education entry
			for (const issue of getFieldIssues(state, `education.${i}`)) {
				console.log(formatInlineIssue(issue));
			}
		}
	} else {
		console.log(pc.dim('  (none)'));
	}

	// Skills section
	const categoryCount = state.skills.length;
	console.log(pc.cyan(`\nSkills (${categoryCount} categories)`));
	if (state.skills.length > 0) {
		for (const category of state.skills) {
			const skillCount = category.skills.length;
			console.log(`  ${category.name}: ${skillCount} skill(s)`);
		}
	} else {
		console.log(pc.dim('  (none)'));
	}

	// Projects section (if any)
	if (state.projects.length > 0) {
		console.log(pc.cyan(`\nProjects (${state.projects.length})`));
		for (let i = 0; i < state.projects.length; i++) {
			const project = state.projects[i];
			if (!project) continue;
			const techSummary =
				project.techStack && project.techStack.length > 0
					? ` (${project.techStack.slice(0, 3).join(', ')}${project.techStack.length > 3 ? '...' : ''})`
					: '';
			console.log(`  ${project.name}${techSummary}`);

			// Show validation issues for this project
			for (const issue of getFieldIssues(state, `projects.${i}`)) {
				console.log(formatInlineIssue(issue));
			}
		}
	}

	// Certifications section (if any)
	if (state.certifications.length > 0) {
		console.log(pc.cyan(`\nCertifications (${state.certifications.length})`));
		for (let i = 0; i < state.certifications.length; i++) {
			const cert = state.certifications[i];
			if (!cert) continue;
			console.log(`  ${cert.name} from ${cert.issuer} (${cert.date})`);

			// Show validation issues for this certification
			for (const issue of getFieldIssues(state, `certifications.${i}`)) {
				console.log(formatInlineIssue(issue));
			}
		}
	}

	// Missing section warnings
	// Per CONTEXT.md: "warn if critical optional sections are missing"
	if (state.skills.length === 0) {
		console.log(
			pc.yellow('\n\u26a0 Skills section is empty - consider adding for ATS'),
		);
	}

	const hasExperience = state.experience.length > 0;
	const hasEducation = state.education.length > 0;
	if (!hasExperience && !hasEducation) {
		console.log(
			pc.yellow(
				'\n\u26a0 No experience or education - add at least one for a complete CV',
			),
		);
	}

	console.log(''); // Empty line before prompt
}

/**
 * Display summary and prompt for confirmation action.
 * @param state - Current wizard state
 * @returns Selected action: 'confirm' to save, 'edit' to return to menu, 'cancel' to discard
 */
export async function confirmSave(
	state: WizardState,
): Promise<'confirm' | 'edit' | 'cancel'> {
	displaySummary(state);

	const action = await select<'confirm' | 'edit' | 'cancel'>({
		message: 'What would you like to do?',
		choices: [
			{ value: 'confirm', name: '\u2713 Save CV' },
			{ value: 'edit', name: '\u270e Return to menu and edit' },
			{ value: 'cancel', name: '\u2717 Cancel without saving' },
		],
	});

	return action;
}
