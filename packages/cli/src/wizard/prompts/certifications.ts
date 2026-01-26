/**
 * Certifications prompt flow for the CV wizard.
 * Collects professional certification information.
 */

import type { Certification } from '@gottz/cv-core';
import { confirm, input } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';
import { validateDate } from '../validation.ts';

/**
 * Collect a single certification entry.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing certification data for editing
 * @returns Promise resolving to certification object
 */
export async function collectSingleCertification(
	mode: WizardMode,
	existing?: Certification,
): Promise<Certification> {
	// Name (required)
	const name = await input({
		message: 'Certification name *:',
		default: existing?.name,
		validate: (value) => {
			if (!value.trim()) return 'Certification name is required';
			return true;
		},
	});

	// Show example for name
	if (!existing) {
		console.log(pc.dim('  e.g., "AWS Solutions Architect - Associate"'));
	}

	// Issuer (required)
	const issuer = await input({
		message: 'Issuing organization *:',
		default: existing?.issuer,
		validate: (value) => {
			if (!value.trim()) return 'Issuing organization is required';
			return true;
		},
	});

	// Show example for issuer
	if (!existing) {
		console.log(pc.dim('  e.g., "Amazon Web Services"'));
	}

	// Date earned (required)
	const date = await input({
		message: 'Date earned (YYYY-MM) *:',
		default: existing?.date,
		validate: (value) => {
			const trimmed = value.trim();
			if (!trimmed) return 'Date earned is required';
			const dateValidation = validateDate(trimmed);
			if (dateValidation !== true) return dateValidation;
			// Don't allow "present" for date earned
			if (trimmed.toLowerCase() === 'present') {
				return 'Please enter the date earned, not "present"';
			}
			return true;
		},
	});

	// Expiry date (optional)
	const expiryDate = await input({
		message: 'Expiry date (YYYY-MM, or empty if no expiry):',
		default: existing?.expiryDate,
		validate: validateDate,
	});

	// Build certification object
	const certification: Certification = {
		name: name.trim(),
		issuer: issuer.trim(),
		date: date.trim(),
		...(expiryDate.trim() && { expiryDate: expiryDate.trim() }),
	};

	// Detailed mode: additional fields
	if (mode === 'detailed') {
		// Credential ID
		const credentialId = await input({
			message: 'Credential ID (optional):',
			default: existing?.credentialId,
		});
		if (credentialId.trim()) {
			certification.credentialId = credentialId.trim();
		}

		// Verification URL
		const verificationUrl = await input({
			message: 'Verification URL (optional):',
			default: existing?.verificationUrl,
		});
		if (verificationUrl.trim()) {
			certification.verificationUrl = verificationUrl.trim();
		}

		// Note: Logo is skipped in wizard - complex file handling
		// Can be added manually to cv.md later
	}

	return certification;
}

/**
 * Collect multiple certification entries with "add another" loop.
 * Certifications section is optional - user can skip entirely.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing certifications for editing
 * @returns Promise resolving to array of certifications
 */
export async function collectCertifications(
	mode: WizardMode,
	existing: Certification[],
): Promise<Certification[]> {
	const entries = [...existing];

	// Show current count
	console.log(pc.cyan(`\nCertifications (${entries.length} added)`));

	// Optional section - default to no
	const addCertification = await confirm({
		message: 'Add a certification?',
		default: false,
	});

	if (!addCertification) {
		return entries;
	}

	// Collect first certification
	const firstCertification = await collectSingleCertification(mode);
	entries.push(firstCertification);

	// Loop for additional certifications
	let addAnother = true;
	while (addAnother) {
		addAnother = await confirm({
			message: 'Add another certification?',
			default: false,
		});

		if (addAnother) {
			const certification = await collectSingleCertification(mode);
			entries.push(certification);
		}
	}

	return entries;
}
