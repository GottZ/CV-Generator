/**
 * Color utilities for config-based palette derivation.
 * Per RESEARCH.md: Use hex colors with simple derivation for v1.
 * Full OKLCH derivation can be done in CSS; this provides hex fallbacks.
 */

export interface ColorPalette {
	accent: string;
	heading: string;
	body: string;
	muted: string;
	border: string;
	background: string;
	surface: string;
}

/** Default color palettes per template aesthetic */
export const DEFAULT_PALETTES: Record<string, ColorPalette> = {
	modern: {
		accent: '#2563eb',
		heading: '#0f172a',
		body: '#1e293b',
		muted: '#64748b',
		border: '#e2e8f0',
		background: '#ffffff',
		surface: '#f8fafc',
	},
	minimal: {
		accent: '#1a365d',
		heading: '#1a1a1a',
		body: '#333333',
		muted: '#666666',
		border: '#d1d5db',
		background: '#ffffff',
		surface: '#f9fafb',
	},
	classic: {
		accent: '#1e40af',
		heading: '#1f2937',
		body: '#374151',
		muted: '#6b7280',
		border: '#d1d5db',
		background: '#ffffff',
		surface: '#f3f4f6',
	},
};

/**
 * Parse hex color to RGB components.
 */
export function hexToRgb(
	hex: string,
): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;
	return {
		r: Number.parseInt(result[1] ?? '0', 16),
		g: Number.parseInt(result[2] ?? '0', 16),
		b: Number.parseInt(result[3] ?? '0', 16),
	};
}

/**
 * Convert RGB to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
	return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/**
 * Validate hex color format.
 */
export function isValidHexColor(color: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Derive a simple neutral palette from an accent color.
 * This is a basic implementation; CSS OKLCH provides better results.
 */
export function deriveColorPalette(
	accentColor: string,
	_baseTemplate = 'modern',
): Partial<ColorPalette> {
	if (!isValidHexColor(accentColor)) {
		return {};
	}

	// Return just the accent; let CSS derive the rest via custom properties
	// Templates use CSS variables with fallbacks for proper derivation
	return {
		accent: accentColor,
	};
}

/**
 * Merge partial color overrides with defaults.
 */
export function mergeColors(
	base: ColorPalette,
	overrides: Partial<ColorPalette> | undefined,
): ColorPalette {
	if (!overrides) return base;

	return {
		accent:
			overrides.accent && isValidHexColor(overrides.accent)
				? overrides.accent
				: base.accent,
		heading:
			overrides.heading && isValidHexColor(overrides.heading)
				? overrides.heading
				: base.heading,
		body:
			overrides.body && isValidHexColor(overrides.body)
				? overrides.body
				: base.body,
		muted:
			overrides.muted && isValidHexColor(overrides.muted)
				? overrides.muted
				: base.muted,
		border:
			overrides.border && isValidHexColor(overrides.border)
				? overrides.border
				: base.border,
		background:
			overrides.background && isValidHexColor(overrides.background)
				? overrides.background
				: base.background,
		surface:
			overrides.surface && isValidHexColor(overrides.surface)
				? overrides.surface
				: base.surface,
	};
}
