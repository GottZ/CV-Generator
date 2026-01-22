/**
 * CSS-to-DOCX style extractor module.
 *
 * Parses CSS custom properties from template styles.css and maps them
 * to docx library equivalents for visual parity with HTML/PDF output.
 */

/**
 * Style configuration for DOCX generation.
 * Values are in formats expected by the docx library.
 */
export interface DocxStyleConfig {
	/** Font sizes in half-points (docx convention: 11pt = 22 half-points) */
	fontSizes: {
		/** Name heading size (--font-size-name) */
		name: number;
		/** Section header size (--font-size-section) */
		section: number;
		/** Subsection/entry header size (--font-size-subsection) */
		subsection: number;
		/** Body text size (--font-size-body) */
		body: number;
		/** Small text like dates (--font-size-small) */
		small: number;
	};
	/** Colors as hex strings without # prefix (docx format) */
	colors: {
		/** Heading color (--color-heading) */
		heading: string;
		/** Body text color (--color-body) */
		body: string;
		/** Accent/link color (--color-accent) */
		accent: string;
		/** Muted text color for dates/locations (--color-muted) */
		muted: string;
	};
	/** Font families */
	fonts: {
		/** Heading font family (--font-heading) */
		heading: string;
		/** Body font family (--font-body) */
		body: string;
	};
	/** Spacing in TWIPs (1mm ~ 57 TWIPs) */
	spacing: {
		/** Page margin (--page-margin) */
		pageMargin: number;
		/** Section gap (--spacing-lg) */
		sectionGap: number;
		/** Entry gap (--spacing-md) */
		entryGap: number;
	};
}

/**
 * Default DOCX styles as fallback when CSS parsing fails.
 * Values match base template defaults.
 */
export const DEFAULT_DOCX_STYLES: DocxStyleConfig = {
	fontSizes: {
		name: 48, // 24pt in half-points
		section: 28, // 14pt in half-points
		subsection: 24, // 12pt in half-points
		body: 22, // 11pt in half-points
		small: 20, // 10pt in half-points
	},
	colors: {
		heading: '1a1a1a',
		body: '333333',
		accent: '2563eb',
		muted: '666666',
	},
	fonts: {
		heading: 'Arial',
		body: 'Arial',
	},
	spacing: {
		pageMargin: 1134, // 20mm in TWIPs
		sectionGap: 360, // ~24px in TWIPs
		entryGap: 240, // ~16px in TWIPs
	},
};

/**
 * Convert pt value to half-points (docx convention).
 * @param ptValue - Font size in points
 * @returns Font size in half-points
 */
export function mapFontSizeHalfPoints(ptValue: number): number {
	return Math.round(ptValue * 2);
}

/**
 * Strip # prefix from CSS hex color for docx format.
 * @param cssColor - CSS color value (e.g., "#1a1a1a")
 * @returns Hex color without # prefix (e.g., "1a1a1a")
 */
export function mapColorHex(cssColor: string): string {
	return cssColor.replace(/^#/, '');
}

/**
 * Convert px value to TWIPs (~15 TWIPs per pixel at 96 DPI).
 * @param pxValue - Spacing in pixels
 * @returns Spacing in TWIPs
 */
export function mapSpacingTwips(pxValue: number): number {
	return Math.round(pxValue * 15);
}

/**
 * Convert mm value to TWIPs (1mm ~ 57 TWIPs).
 * @param mmValue - Spacing in millimeters
 * @returns Spacing in TWIPs
 */
export function mapMmToTwips(mmValue: number): number {
	return Math.round(mmValue * 56.7);
}

/**
 * Extract first font family name from CSS font-family value.
 * @param fontFamily - CSS font-family value (e.g., "Arial, Helvetica, sans-serif")
 * @returns First font family name (e.g., "Arial")
 */
function extractFirstFontFamily(fontFamily: string): string {
	// Remove quotes and split by comma, take first
	const first = fontFamily.split(',')[0]?.trim() ?? 'Arial';
	// Remove surrounding quotes if present
	return first.replace(/^["']|["']$/g, '');
}

/**
 * Parse pt value from CSS property value.
 * @param value - CSS value (e.g., "24pt", "11pt")
 * @returns Numeric pt value or null
 */
function parsePtValue(value: string): number | null {
	const match = value.match(/^(\d+(?:\.\d+)?)\s*pt$/i);
	return match?.[1] ? Number.parseFloat(match[1]) : null;
}

/**
 * Parse px value from CSS property value.
 * @param value - CSS value (e.g., "24px", "16px")
 * @returns Numeric px value or null
 */
function parsePxValue(value: string): number | null {
	const match = value.match(/^(\d+(?:\.\d+)?)\s*px$/i);
	return match?.[1] ? Number.parseFloat(match[1]) : null;
}

/**
 * Parse mm value from CSS property value.
 * @param value - CSS value (e.g., "20mm")
 * @returns Numeric mm value or null
 */
function parseMmValue(value: string): number | null {
	const match = value.match(/^(\d+(?:\.\d+)?)\s*mm$/i);
	return match?.[1] ? Number.parseFloat(match[1]) : null;
}

/**
 * Extract CSS custom properties from CSS content.
 * @param cssContent - Raw CSS content
 * @returns Map of property names to values
 */
function extractCssCustomProperties(cssContent: string): Map<string, string> {
	const properties = new Map<string, string>();

	// Match CSS custom properties: --property-name: value;
	// Handle multiline and various whitespace
	const propertyRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
	let match: RegExpExecArray | null = null;

	while (true) {
		match = propertyRegex.exec(cssContent);
		if (!match) break;
		const name = match[1];
		const value = match[2]?.trim();
		if (name && value) {
			properties.set(`--${name}`, value);
		}
	}

	return properties;
}

/**
 * Extract CSS styles from template CSS content and convert to DocxStyleConfig.
 *
 * Parses CSS custom properties (--font-size-*, --color-*, etc.) and maps
 * them to docx library equivalents.
 *
 * @param cssContent - Raw CSS content from styles.css
 * @returns DocxStyleConfig with values extracted from CSS
 */
export function extractStylesFromCss(cssContent: string): DocxStyleConfig {
	const props = extractCssCustomProperties(cssContent);

	// Extract font sizes (pt -> half-points)
	const fontSizeName = parsePtValue(props.get('--font-size-name') ?? '');
	const fontSizeSection = parsePtValue(props.get('--font-size-section') ?? '');
	const fontSizeSubsection = parsePtValue(
		props.get('--font-size-subsection') ?? '',
	);
	const fontSizeBody = parsePtValue(props.get('--font-size-body') ?? '');
	const fontSizeSmall = parsePtValue(props.get('--font-size-small') ?? '');

	// Extract colors (strip # prefix)
	const colorHeading = props.get('--color-heading');
	const colorBody = props.get('--color-body');
	const colorAccent = props.get('--color-accent');
	const colorMuted = props.get('--color-muted');

	// Extract font families (first family only)
	const fontHeading = props.get('--font-heading');
	const fontBody = props.get('--font-body');

	// Extract spacing
	const pageMargin = parseMmValue(props.get('--page-margin') ?? '');
	const spacingLg = parsePxValue(props.get('--spacing-lg') ?? '');
	const spacingMd = parsePxValue(props.get('--spacing-md') ?? '');

	return {
		fontSizes: {
			name:
				fontSizeName !== null
					? mapFontSizeHalfPoints(fontSizeName)
					: DEFAULT_DOCX_STYLES.fontSizes.name,
			section:
				fontSizeSection !== null
					? mapFontSizeHalfPoints(fontSizeSection)
					: DEFAULT_DOCX_STYLES.fontSizes.section,
			subsection:
				fontSizeSubsection !== null
					? mapFontSizeHalfPoints(fontSizeSubsection)
					: DEFAULT_DOCX_STYLES.fontSizes.subsection,
			body:
				fontSizeBody !== null
					? mapFontSizeHalfPoints(fontSizeBody)
					: DEFAULT_DOCX_STYLES.fontSizes.body,
			small:
				fontSizeSmall !== null
					? mapFontSizeHalfPoints(fontSizeSmall)
					: DEFAULT_DOCX_STYLES.fontSizes.small,
		},
		colors: {
			heading: colorHeading
				? mapColorHex(colorHeading)
				: DEFAULT_DOCX_STYLES.colors.heading,
			body: colorBody
				? mapColorHex(colorBody)
				: DEFAULT_DOCX_STYLES.colors.body,
			accent: colorAccent
				? mapColorHex(colorAccent)
				: DEFAULT_DOCX_STYLES.colors.accent,
			muted: colorMuted
				? mapColorHex(colorMuted)
				: DEFAULT_DOCX_STYLES.colors.muted,
		},
		fonts: {
			heading: fontHeading
				? extractFirstFontFamily(fontHeading)
				: DEFAULT_DOCX_STYLES.fonts.heading,
			body: fontBody
				? extractFirstFontFamily(fontBody)
				: DEFAULT_DOCX_STYLES.fonts.body,
		},
		spacing: {
			pageMargin:
				pageMargin !== null
					? mapMmToTwips(pageMargin)
					: DEFAULT_DOCX_STYLES.spacing.pageMargin,
			sectionGap:
				spacingLg !== null
					? mapSpacingTwips(spacingLg)
					: DEFAULT_DOCX_STYLES.spacing.sectionGap,
			entryGap:
				spacingMd !== null
					? mapSpacingTwips(spacingMd)
					: DEFAULT_DOCX_STYLES.spacing.entryGap,
		},
	};
}
