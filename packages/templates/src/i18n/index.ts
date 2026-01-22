import { de } from './de.ts';
import { en } from './en.ts';

/**
 * All section header translations indexed by locale.
 */
export const sectionHeaders: Record<string, Record<string, string>> = {
	en,
	de,
};

/**
 * Get section header for a given section type and locale.
 * Falls back to English if locale not found.
 * Falls back to section type if header not found.
 */
export function getSectionHeader(section: string, locale: string): string {
	const headers = sectionHeaders[locale] ?? sectionHeaders.en;
	return headers?.[section] ?? section;
}

export { de, en };
