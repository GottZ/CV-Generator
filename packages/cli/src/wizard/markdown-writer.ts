/**
 * Markdown writer for wizard output.
 * Converts WizardState to cv.md format compatible with the existing parser.
 * Implements WIZ-13: Progress indication during file write.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import type { WizardState } from './types.ts';

/**
 * Generate markdown content from wizard state.
 * Follows exact format from scaffolder.ts createExampleMarkdown().
 * @param state - Current wizard state
 * @param locale - Locale for localized sections (default: 'en')
 * @returns Markdown content string
 */
export function generateMarkdown(
	state: WizardState,
	locale: string = 'en',
): string {
	const lines: string[] = [];

	// Frontmatter section
	lines.push('---');
	if (state.contact) {
		lines.push(`name: ${state.contact.name}`);
		if (state.contact.email) {
			lines.push(`email: ${state.contact.email}`);
		}
		if (state.contact.phone) {
			lines.push(`phone: ${state.contact.phone}`);
		}
		if (state.contact.location) {
			lines.push(`location: ${state.contact.location}`);
		}
		if (state.contact.links && state.contact.links.length > 0) {
			lines.push('links:');
			for (const link of state.contact.links) {
				lines.push(`  - url: ${link.url}`);
				lines.push(`    type: ${link.type}`);
				if (link.label) {
					lines.push(`    label: ${link.label}`);
				}
			}
		}
	}
	lines.push('---');
	lines.push('');

	// Experience section (if any)
	if (state.experience.length > 0) {
		lines.push(`## Experience \`${locale}\``);
		lines.push('');

		for (let i = 0; i < state.experience.length; i++) {
			const exp = state.experience[i];
			if (!exp) continue;

			lines.push(`### ${exp.role} at ${exp.company}`);

			// Date line with optional location
			const dateLine = exp.location
				? `*${exp.startDate} - ${exp.endDate} | ${exp.location}*`
				: `*${exp.startDate} - ${exp.endDate}*`;
			lines.push(dateLine);
			lines.push('');

			// Bullets
			for (const bullet of exp.bullets) {
				lines.push(`- ${bullet}`);
			}

			// Tech stack (if present)
			if (exp.techStack && exp.techStack.length > 0) {
				lines.push('');
				lines.push('#### Technologies');
				for (const tech of exp.techStack) {
					lines.push(`- ${tech}`);
				}
			}

			// Separator between entries (except for last)
			if (i < state.experience.length - 1) {
				lines.push('');
				lines.push('---');
			}
			lines.push('');
		}
	}

	// Education section (if any)
	if (state.education.length > 0) {
		lines.push(`## Education \`${locale}\``);
		lines.push('');

		for (let i = 0; i < state.education.length; i++) {
			const edu = state.education[i];
			if (!edu) continue;

			lines.push(`### ${edu.degree}`);
			lines.push(`*${edu.institution} | ${edu.startDate} - ${edu.endDate}*`);
			lines.push('');

			// Optional fields
			if (edu.field) {
				lines.push(edu.field);
			}
			if (edu.honors) {
				lines.push(edu.honors);
			}
			if (edu.notes) {
				lines.push(edu.notes);
			}

			// Separator between entries (except for last)
			if (i < state.education.length - 1) {
				lines.push('');
				lines.push('---');
			}
			lines.push('');
		}
	}

	// Skills section (if any)
	if (state.skills.length > 0) {
		lines.push(`## Skills \`${locale}\``);
		lines.push('');

		for (const category of state.skills) {
			lines.push(`### ${category.name}`);
			for (const skill of category.skills) {
				// Include level if present
				if (skill.level) {
					lines.push(`- ${skill.name} (${skill.level})`);
				} else {
					lines.push(`- ${skill.name}`);
				}
			}
			lines.push('');
		}
	}

	// Projects section (if any)
	if (state.projects.length > 0) {
		lines.push(`## Projects \`${locale}\``);
		lines.push('');

		for (let i = 0; i < state.projects.length; i++) {
			const project = state.projects[i];
			if (!project) continue;

			lines.push(`### ${project.name}`);
			lines.push('');

			if (project.description) {
				lines.push(project.description);
				lines.push('');
			}

			if (project.techStack && project.techStack.length > 0) {
				lines.push(`**Technologies:** ${project.techStack.join(', ')}`);
				lines.push('');
			}

			if (project.links && project.links.length > 0) {
				lines.push('**Links:**');
				for (const link of project.links) {
					const linkType = link.type ?? 'link';
					const label = link.label ?? linkType;
					lines.push(`- [${label}](${link.url})`);
				}
				lines.push('');
			}

			// Separator between entries (except for last)
			if (i < state.projects.length - 1) {
				lines.push('---');
				lines.push('');
			}
		}
	}

	// Certifications section (if any - NOT localized per schema)
	if (state.certifications.length > 0) {
		lines.push('## Certifications');
		lines.push('');

		for (let i = 0; i < state.certifications.length; i++) {
			const cert = state.certifications[i];
			if (!cert) continue;

			lines.push(`### ${cert.name}`);
			lines.push(`*${cert.issuer} | ${cert.date}*`);
			lines.push('');

			if (cert.expiryDate) {
				lines.push(`Expires: ${cert.expiryDate}`);
			}
			if (cert.credentialId) {
				lines.push(`Credential ID: ${cert.credentialId}`);
			}
			if (cert.verificationUrl) {
				lines.push(`[Verify](${cert.verificationUrl})`);
			}

			// Separator between entries (except for last)
			if (i < state.certifications.length - 1) {
				lines.push('');
				lines.push('---');
			}
			lines.push('');
		}
	}

	return lines.join('\n');
}

/**
 * Write wizard state to cv.md file.
 * Creates person directory if needed.
 * Uses ora spinner per WIZ-13 for progress indication.
 * @param state - Current wizard state
 * @param personDir - Full path to person directory
 * @param locale - Locale for localized sections (default: 'en')
 */
export async function writeWizardOutput(
	state: WizardState,
	personDir: string,
	locale: string = 'en',
): Promise<void> {
	const spinner = ora('Writing CV...').start();

	try {
		// Create person directory if needed
		await mkdir(personDir, { recursive: true });

		// Generate markdown content
		const content = generateMarkdown(state, locale);

		// Write file
		const cvPath = path.join(personDir, 'cv.md');
		await writeFile(cvPath, content, 'utf-8');

		spinner.succeed('CV saved');
	} catch (error) {
		spinner.fail('Failed to save CV');
		throw error;
	}
}
