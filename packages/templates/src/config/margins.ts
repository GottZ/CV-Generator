/**
 * Margin configuration types and resolution.
 * Per CONTEXT.md: Named sizes with fallback to numeric mm values.
 */

export type MarginConfig = 'narrow' | 'normal' | 'wide' | number;

/** Named margin sizes in millimeters */
export const NAMED_MARGINS: Record<string, number> = {
	narrow: 15,
	normal: 20,
	wide: 30,
};

/**
 * Resolve margin config to mm value.
 * Accepts named sizes ('narrow', 'normal', 'wide') or numeric mm values.
 * Clamps numeric values to reasonable range (10-40mm).
 *
 * @param config - Margin configuration (string or number)
 * @returns Margin in millimeters
 */
export function resolveMargin(config: MarginConfig | undefined): number {
	const defaultMargin = NAMED_MARGINS.normal ?? 20;

	if (config === undefined) {
		return defaultMargin;
	}

	if (typeof config === 'number') {
		// Clamp to reasonable range
		return Math.max(10, Math.min(40, config));
	}

	const margin = NAMED_MARGINS[config.toLowerCase()];
	if (margin !== undefined) {
		return margin;
	}

	// Try parsing as number (e.g., "25" or "25mm")
	const parsed = Number.parseFloat(config);
	if (!Number.isNaN(parsed)) {
		return Math.max(10, Math.min(40, parsed));
	}

	// Fallback to normal if unrecognized
	return defaultMargin;
}

/**
 * Convert margin mm to CSS value.
 */
export function marginToCss(mm: number): string {
	return `${mm}mm`;
}
