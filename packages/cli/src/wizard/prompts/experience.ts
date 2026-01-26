/**
 * Work experience prompt flow.
 * Collects company, role, dates, location, bullets, and tech stack.
 */

import type { WorkExperience } from '@gottz/cv-core';
import { confirm, input } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';
import { createValidatingInput, validateDate } from '../validation.ts';

/**
 * Collect achievement/responsibility bullets with repeated prompts.
 * Per RESEARCH.md: "Repeated input prompts with 'Add another bullet?' or empty Enter to finish"
 * Minimum 1 bullet required.
 *
 * @param existing - Existing bullets to show as context
 * @returns Promise resolving to array of bullet strings
 */
export async function collectBullets(existing?: string[]): Promise<string[]> {
	const bullets: string[] = [];

	// Show existing bullets if editing
	if (existing && existing.length > 0) {
		console.log(pc.dim('\nExisting bullets:'));
		for (const bullet of existing) {
			console.log(pc.dim(`  - ${bullet}`));
		}
		console.log('');
	}

	console.log(
		pc.dim('  Enter achievements/responsibilities (empty line to finish)'),
	);

	// Collect bullets until empty input
	let bulletCount = 0;
	while (true) {
		const bullet = await input({
			message: `Bullet ${bulletCount + 1} (empty to finish):`,
		});

		const trimmed = bullet.trim();

		// Empty input = done (if we have at least 1 bullet)
		if (!trimmed) {
			if (bullets.length === 0) {
				console.log(pc.yellow('  At least one bullet is required'));
				continue;
			}
			break;
		}

		bullets.push(trimmed);
		bulletCount++;
	}

	return bullets;
}

/**
 * Collect tech stack as comma-separated input.
 * @param existing - Existing tech stack for defaults
 * @returns Promise resolving to array of tech strings
 */
export async function collectTechStack(existing?: string[]): Promise<string[]> {
	const techInput = await input({
		message: 'Technologies used (comma-separated, or empty to skip):',
		default: existing?.join(', '),
	});

	const trimmed = techInput.trim();
	if (!trimmed) return [];

	return trimmed
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

/**
 * Collect a single work experience entry.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing experience entry for editing (optional)
 * @returns Promise resolving to WorkExperience object
 */
export async function collectSingleExperience(
	mode: WizardMode,
	existing?: WorkExperience,
): Promise<WorkExperience> {
	// Company (required)
	const company = await createValidatingInput({
		message: 'Company name *:',
		required: true,
		default: existing?.company,
	});

	// Role (required)
	const role = await createValidatingInput({
		message: 'Job title/role *:',
		required: true,
		default: existing?.role,
	});

	// Start date (required)
	const startDate = await createValidatingInput({
		message: 'Start date (YYYY-MM) *:',
		required: true,
		default: existing?.startDate,
		validate: validateDate,
	});

	// End date (default: present)
	const endDate = await createValidatingInput({
		message: 'End date (default: Present):',
		default: existing?.endDate ?? 'present',
		validate: validateDate,
	});

	// Location (detailed mode only)
	let location: string | undefined;
	if (mode === 'detailed') {
		const locationInput = await input({
			message: 'Location (City, Country):',
			default: existing?.location,
		});
		location = locationInput.trim() || undefined;
	}

	// Bullets (always required - at least 1)
	console.log(pc.dim('\n  Add achievements/responsibilities for this role:'));
	const bullets = await collectBullets(existing?.bullets);

	// Tech stack (detailed mode only)
	let techStack: string[] | undefined;
	if (mode === 'detailed') {
		const tech = await collectTechStack(existing?.techStack);
		techStack = tech.length > 0 ? tech : undefined;
	}

	return {
		company: company.trim(),
		role: role.trim(),
		startDate: startDate.trim(),
		endDate: endDate.trim() || 'present',
		...(location && { location }),
		bullets,
		...(techStack && { techStack }),
	};
}

/**
 * Collect work experience entries with "add another" loop.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing experience entries to start with
 * @returns Updated array of experience entries
 */
export async function collectExperience(
	mode: WizardMode,
	existing: WorkExperience[],
): Promise<WorkExperience[]> {
	const entries = [...existing];

	// Show count header
	console.log(pc.cyan(`\nWork Experience (${entries.length} added)`));

	// Collect first entry
	const firstEntry = await collectSingleExperience(mode);
	entries.push(firstEntry);

	// Loop for additional entries
	while (true) {
		const addAnother = await confirm({
			message: 'Add another work experience?',
			default: false,
		});

		if (!addAnother) break;

		console.log(pc.cyan(`\nWork Experience (${entries.length} added)`));
		const entry = await collectSingleExperience(mode);
		entries.push(entry);
	}

	return entries;
}
