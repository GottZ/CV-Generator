/**
 * Education prompt flow.
 * Collects education entries with institution, degree, field, dates.
 */

import type { Education } from '@gottz/cv-core';
import { confirm, input } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';
import { createValidatingInput, validateDate } from '../validation.ts';

/**
 * Collect education entries with "add another" loop.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing education entries to start with
 * @returns Updated array of education entries
 */
export async function collectEducation(
	mode: WizardMode,
	existing: Education[],
): Promise<Education[]> {
	const entries = [...existing];

	// Show count header
	console.log(pc.cyan(`\nEducation (${entries.length} added)`));

	// Collect first entry
	const firstEntry = await collectSingleEducation(mode);
	entries.push(firstEntry);

	// Loop for additional entries
	let addMore = await confirm({
		message: 'Add another education entry?',
		default: false,
	});

	while (addMore) {
		const entry = await collectSingleEducation(mode);
		entries.push(entry);

		addMore = await confirm({
			message: 'Add another education entry?',
			default: false,
		});
	}

	return entries;
}

/**
 * Collect a single education entry.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing education entry for editing (optional)
 * @returns Education entry
 */
export async function collectSingleEducation(
	mode: WizardMode,
	existing?: Education,
): Promise<Education> {
	// Institution (required)
	const institution = await createValidatingInput({
		message: 'Institution name *:',
		default: existing?.institution,
		required: true,
	});

	// Degree (required)
	const degree = await createValidatingInput({
		message: 'Degree/Certificate *:',
		default: existing?.degree,
		required: true,
	});
	console.log(pc.dim('  e.g., "B.Sc.", "MBA", "Fachinformatiker"'));

	// Field of study (optional)
	const field = await input({
		message: 'Field of study:',
		default: existing?.field,
	});
	console.log(pc.dim('  e.g., "Computer Science"'));

	// Start date (required)
	const startDate = await createValidatingInput({
		message: 'Start date (YYYY-MM) *:',
		default: existing?.startDate,
		required: true,
		validate: validateDate,
	});

	// End date (required)
	const endDate = await createValidatingInput({
		message: 'End date (YYYY-MM) *:',
		default: existing?.endDate,
		required: true,
		validate: validateDate,
	});

	// Build base education entry
	const education: Education = {
		institution: institution.trim(),
		degree: degree.trim(),
		startDate: startDate.trim(),
		endDate: endDate.trim(),
	};

	// Optional field
	if (field.trim()) {
		education.field = field.trim();
	}

	// Detailed mode: location, honors, notes
	if (mode === 'detailed') {
		const location = await input({
			message: 'Location:',
			default: existing?.location,
		});
		if (location.trim()) {
			education.location = location.trim();
		}

		const honors = await input({
			message: 'Honors/GPA (optional):',
			default: existing?.honors,
		});
		if (honors.trim()) {
			education.honors = honors.trim();
		}

		const notes = await input({
			message: 'Additional notes (optional):',
			default: existing?.notes,
		});
		if (notes.trim()) {
			education.notes = notes.trim();
		}
	}

	return education;
}
