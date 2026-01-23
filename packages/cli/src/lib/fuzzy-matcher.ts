import Fuse from 'fuse.js';

/**
 * Suggest similar template name if input doesn't match.
 * Per CONTEXT.md: "Did you mean 'modern'?"
 */
export function suggestTemplate(
	input: string,
	available: string[],
): string | null {
	if (available.length === 0) return null;

	const fuse = new Fuse(available, {
		threshold: 0.4,
		distance: 100,
	});

	const results = fuse.search(input);
	return results.length > 0 ? (results[0]?.item ?? null) : null;
}

/**
 * Format template not found error with suggestion.
 */
export function templateNotFoundError(
	templateId: string,
	available: string[],
): Error {
	const suggestion = suggestTemplate(templateId, available);
	let message = `Template "${templateId}" not found.`;

	if (suggestion) {
		message += ` Did you mean "${suggestion}"?`;
	}

	if (available.length > 0) {
		message += ` Available: ${available.join(', ')}`;
	}

	return new Error(message);
}

/**
 * Suggest similar person name if input doesn't match.
 * Per CONTEXT.md: "Did you mean 'john-doe'?"
 */
export function suggestPerson(
	input: string,
	available: string[],
): string | null {
	if (available.length === 0) return null;

	const fuse = new Fuse(available, {
		threshold: 0.4,
		distance: 100,
	});

	const results = fuse.search(input);
	return results.length > 0 ? (results[0]?.item ?? null) : null;
}

/**
 * Format person not found error with suggestion.
 * Per CONTEXT.md: Always include "Try: ..." suggestion.
 */
export function personNotFoundError(
	personName: string,
	available: string[],
): Error {
	const suggestion = suggestPerson(personName, available);
	let message = `Person "${personName}" not found.`;

	if (suggestion) {
		message += ` Did you mean "${suggestion}"?`;
	}

	if (available.length > 0 && available.length <= 5) {
		message += ` Available: ${available.join(', ')}`;
	}

	// Per CONTEXT.md: Always include "Try: ..." suggestion
	message += `\n\nTry: cvgen init ${personName}`;

	return new Error(message);
}
