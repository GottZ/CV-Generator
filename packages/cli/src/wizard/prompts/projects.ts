/**
 * Projects prompt flow for the CV wizard.
 * Collects project portfolio information with links and tech stack.
 */

import type { Project, ProjectLink } from '@gottz/cv-core';
import { confirm, input, select } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';
import { validateDate } from '../validation.ts';

/**
 * Common project link types for selection.
 */
const LINK_TYPES = [
	{ value: 'github', name: 'GitHub' },
	{ value: 'demo', name: 'Live Demo' },
	{ value: 'npm', name: 'NPM Package' },
	{ value: 'docs', name: 'Documentation' },
	{ value: 'website', name: 'Website' },
	{ value: 'other', name: 'Other' },
] as const;

/**
 * Project type options for detailed mode.
 */
const PROJECT_TYPES = [
	{ value: 'personal' as const, name: 'Personal' },
	{ value: 'professional' as const, name: 'Professional' },
	{ value: 'open-source' as const, name: 'Open Source' },
	{ value: 'freelance' as const, name: 'Freelance' },
] as const;

/**
 * Validate a URL string.
 * @param value - URL to validate
 * @returns true if valid or empty, error message if invalid
 */
function validateUrl(value: string): true | string {
	const trimmed = value.trim();
	if (!trimmed) return true; // Empty is allowed

	// Basic URL validation
	try {
		new URL(trimmed);
		return true;
	} catch {
		return 'Please enter a valid URL (e.g., https://github.com/user/repo)';
	}
}

/**
 * Collect a single project link.
 * @returns Promise resolving to project link
 */
async function collectSingleProjectLink(): Promise<ProjectLink> {
	const type = await select({
		message: 'Link type:',
		choices: LINK_TYPES,
	});

	const url = await input({
		message: 'URL *:',
		validate: (value) => {
			const trimmed = value.trim();
			if (!trimmed) return 'URL is required';
			return validateUrl(trimmed);
		},
	});

	const label = await input({
		message: 'Display label (optional):',
	});

	return {
		url: url.trim(),
		type,
		...(label.trim() && { label: label.trim() }),
	};
}

/**
 * Collect project links with "add another" loop.
 * @param existing - Existing links to show/edit
 * @returns Promise resolving to array of project links
 */
async function collectProjectLinks(
	existing?: ProjectLink[],
): Promise<ProjectLink[]> {
	const links: ProjectLink[] = [];

	// Show existing links if any
	if (existing && existing.length > 0) {
		console.log(pc.dim(`  Existing links: ${existing.length}`));
		for (const link of existing) {
			const linkType = link.type ?? 'link';
			console.log(pc.dim(`    - ${linkType}: ${link.url}`));
		}
	}

	// Collect new links
	let addMore = true;
	while (addMore) {
		const link = await collectSingleProjectLink();
		links.push(link);

		addMore = await confirm({
			message: 'Add another link?',
			default: false,
		});
	}

	return links;
}

/**
 * Collect a single project entry.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing project data for editing
 * @returns Promise resolving to project object
 */
export async function collectSingleProject(
	mode: WizardMode,
	existing?: Project,
): Promise<Project> {
	// Name (required)
	const name = await input({
		message: 'Project name *:',
		default: existing?.name,
		validate: (value) => {
			if (!value.trim()) return 'Project name is required';
			return true;
		},
	});

	// Description (optional)
	const description = await input({
		message: 'Description (brief overview):',
		default: existing?.description,
	});

	// Tech stack (optional, comma-separated)
	const techStackInput = await input({
		message: 'Technologies used (comma-separated):',
		default: existing?.techStack?.join(', '),
	});
	const techStack = techStackInput
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);

	// Build project object with required fields
	const project: Project = {
		name: name.trim(),
		...(description.trim() && { description: description.trim() }),
		...(techStack.length > 0 && { techStack }),
	};

	// Detailed mode: additional fields
	if (mode === 'detailed') {
		// Project type
		const existingType = existing?.type ?? 'personal';
		const projectType = await select({
			message: 'Project type:',
			choices: PROJECT_TYPES,
			default: existingType,
		});
		project.type = projectType as Project['type'];

		// Role
		const role = await input({
			message: 'Your role (e.g., Lead Developer, Contributor):',
			default: existing?.role,
		});
		if (role.trim()) {
			project.role = role.trim();
		}

		// Outcome
		const outcome = await input({
			message: 'Outcome/result (optional):',
			default: existing?.outcome,
		});
		if (outcome.trim()) {
			project.outcome = outcome.trim();
		}

		// Start date
		const startDate = await input({
			message: 'Start date (YYYY-MM, optional):',
			default: existing?.startDate,
			validate: validateDate,
		});
		if (startDate.trim()) {
			project.startDate = startDate.trim();
		}

		// End date
		const endDate = await input({
			message: 'End date (YYYY-MM or "present", optional):',
			default: existing?.endDate,
			validate: validateDate,
		});
		if (endDate.trim()) {
			project.endDate = endDate.trim();
		}
	}

	// Project links (always offered)
	const addLinks = await confirm({
		message: 'Add a project link? (GitHub, demo, etc.)',
		default: false,
	});

	if (addLinks) {
		project.links = await collectProjectLinks(existing?.links);
	} else if (existing?.links && existing.links.length > 0) {
		// Preserve existing links if user doesn't want to add new ones
		project.links = existing.links;
	}

	return project;
}

/**
 * Collect multiple project entries with "add another" loop.
 * Projects section is optional - user can skip entirely.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing projects for editing
 * @returns Promise resolving to array of projects
 */
export async function collectProjects(
	mode: WizardMode,
	existing: Project[],
): Promise<Project[]> {
	const entries = [...existing];

	// Show current count
	console.log(pc.cyan(`\nProjects (${entries.length} added)`));

	// Optional section - default to no
	const addProject = await confirm({
		message: 'Add a project?',
		default: false,
	});

	if (!addProject) {
		return entries;
	}

	// Collect first project
	const firstProject = await collectSingleProject(mode);
	entries.push(firstProject);

	// Loop for additional projects
	let addAnother = true;
	while (addAnother) {
		addAnother = await confirm({
			message: 'Add another project?',
			default: false,
		});

		if (addAnother) {
			const project = await collectSingleProject(mode);
			entries.push(project);
		}
	}

	return entries;
}
