import { de } from './de.ts';
import { en } from './en.ts';

/**
 * All translations indexed by locale.
 * Contains section headers and general i18n text.
 */
export const translations: Record<string, Record<string, string>> = {
	en,
	de,
};

/**
 * @deprecated Use getLocalizedText instead
 */
export const sectionHeaders = translations;

/**
 * Get localized text for a given key and locale.
 * Falls back to English if locale not found.
 * Falls back to key itself if translation not found.
 */
export function getLocalizedText(key: string, locale: string): string {
	const texts = translations[locale] ?? translations.en;
	return texts?.[key] ?? key;
}

/**
 * Get section header for a given section type and locale.
 * Falls back to English if locale not found.
 * Falls back to section type if header not found.
 */
export function getSectionHeader(section: string, locale: string): string {
	return getLocalizedText(section, locale);
}

export { de, en };
