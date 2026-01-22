/**
 * Wrapper type for multi-language content.
 * Keys are locale codes (e.g., 'en', 'de', 'fr').
 * Extensible to any language, not limited to predefined set.
 */
export type Localized<T> = {
	[locale: string]: T;
};
