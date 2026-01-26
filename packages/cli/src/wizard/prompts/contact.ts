/**
 * Contact information prompt flow.
 * Collects name (required), email, phone, location, and links.
 */

import type { Contact, Link } from '@gottz/cv-core';
import { confirm, input, Separator, select } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';
import { createValidatingInput, validateEmail } from '../validation.ts';

/**
 * Link type options for selection.
 */
const LINK_TYPES = [
	{ value: 'linkedin', name: 'LinkedIn' },
	{ value: 'github', name: 'GitHub' },
	{ value: 'website', name: 'Website/Portfolio' },
	{ value: 'twitter', name: 'Twitter/X' },
	{ value: 'other', name: 'Other' },
] as const;

/**
 * Back/cancel option for select menus.
 */
const BACK_CHOICE = { value: 'back' as const, name: '\u2190 Back (cancel)' };

/**
 * Basic URL validation.
 * @param value - URL string to validate
 * @returns true if valid or empty, error message if invalid
 */
function validateUrl(value: string): true | string {
	const trimmed = value.trim();

	// Empty is valid (optional)
	if (!trimmed) return true;

	// Basic URL format validation
	try {
		new URL(trimmed);
		return true;
	} catch {
		// Try with https:// prefix
		try {
			new URL(`https://${trimmed}`);
			return true;
		} catch {
			return 'Please enter a valid URL (e.g., https://example.com)';
		}
	}
}

/**
 * Normalize URL to ensure it has a protocol.
 * @param url - URL string to normalize
 * @returns URL with protocol, or empty string if input is empty
 */
function normalizeUrl(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return '';

	try {
		new URL(trimmed);
		return trimmed;
	} catch {
		// Add https:// if no protocol
		return `https://${trimmed}`;
	}
}

/**
 * Collect a single link entry.
 * @returns Promise resolving to a Link object, or null if user cancels
 */
export async function collectSingleLink(): Promise<Link | null> {
	// Select link type with back option
	const type = await select({
		message: 'Link type:',
		choices: [BACK_CHOICE, new Separator(), ...LINK_TYPES],
	});

	// Handle back/cancel
	if (type === 'back') {
		return null;
	}

	// Collect URL with validation
	const url = await createValidatingInput({
		message: 'URL *:',
		required: true,
		validate: validateUrl,
	});

	// Optional label
	const label = await input({
		message: 'Display label (optional):',
	});

	return {
		type,
		url: normalizeUrl(url),
		...(label.trim() && { label: label.trim() }),
	};
}

/**
 * Collect multiple links with "add another" pattern.
 * @param existing - Existing links to show as context
 * @returns Promise resolving to array of Link objects
 */
export async function collectLinks(existing?: Link[]): Promise<Link[]> {
	const links: Link[] = [];

	// Show existing links if editing
	if (existing && existing.length > 0) {
		console.log(pc.dim('\nExisting links:'));
		for (const link of existing) {
			const label = link.label ? ` (${link.label})` : '';
			console.log(pc.dim(`  - ${link.type}: ${link.url}${label}`));
		}
		console.log('');
	}

	// First prompt: "Add a link?"
	const addFirst = await confirm({
		message: 'Add a link? (LinkedIn, GitHub, portfolio, etc.)',
		default: !existing || existing.length === 0,
	});

	if (!addFirst) {
		// Keep existing links if user doesn't want to add
		return existing ?? [];
	}

	// Collect first link
	const firstLink = await collectSingleLink();
	if (firstLink) {
		links.push(firstLink);
	}

	// Loop for additional links
	while (true) {
		const addAnother = await confirm({
			message: 'Add another link?',
			default: false,
		});

		if (!addAnother) break;

		const link = await collectSingleLink();
		if (link) {
			links.push(link);
		}
	}

	return links;
}

/**
 * Collect contact information.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing contact data for defaults when editing
 * @returns Promise resolving to Contact object
 */
export async function collectContact(
	mode: WizardMode,
	existing?: Contact | null,
): Promise<Contact> {
	console.log(pc.cyan('\nContact Information'));

	// Name (required)
	const name = await createValidatingInput({
		message: 'Full name *:',
		required: true,
		default: existing?.name,
	});

	// Email (optional, with validation)
	const email = await createValidatingInput({
		message: 'Email address:',
		default: existing?.email,
		validate: validateEmail,
	});

	// Phone (optional, detailed mode only)
	let phone: string | undefined;
	if (mode === 'detailed') {
		const phoneInput = await input({
			message: 'Phone number:',
			default: existing?.phone,
		});
		phone = phoneInput.trim() || undefined;
	}

	// Location (optional, detailed mode only)
	let location: string | undefined;
	if (mode === 'detailed') {
		const locationInput = await input({
			message: 'Location (City, Country):',
			default: existing?.location,
		});
		location = locationInput.trim() || undefined;
	}

	// Links (optional)
	const links = await collectLinks(existing?.links);

	return {
		name: name.trim(),
		...(email.trim() && { email: email.trim() }),
		...(phone && { phone }),
		...(location && { location }),
		...(links.length > 0 && { links }),
	};
}
