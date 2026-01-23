/**
 * Configuration cascade system.
 * Priority (lowest to highest):
 * 1. Template defaults (from template's styles.css)
 * 2. Global config (/config.json)
 * 3. Template config (/templates/{name}/config.json)
 * 4. Environment variables (CVGEN_ACCENT_COLOR, etc.)
 * 5. Person frontmatter (cv.md style field)
 *
 * Per CONTEXT.md: Invalid config produces warning, generation continues.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResolvedStyle, StyleConfig, TemplateConfig } from '../types.ts';
import {
	type ColorPalette,
	DEFAULT_PALETTES,
	isValidHexColor,
	mergeColors,
} from './colors.ts';
import { marginToCss, resolveMargin } from './margins.ts';

export type { ColorPalette } from './colors.ts';
export {
	DEFAULT_PALETTES,
	deriveColorPalette,
	hexToRgb,
	isValidHexColor,
	mergeColors,
	rgbToHex,
} from './colors.ts';
export { marginToCss, NAMED_MARGINS, resolveMargin } from './margins.ts';

/** Supported environment variable mappings */
const ENV_MAPPINGS: Record<string, (value: string) => Partial<StyleConfig>> = {
	CVGEN_ACCENT_COLOR: (v) => ({ accentColor: v }),
	CVGEN_FONT_HEADING: (v) => ({ fontHeading: v }),
	CVGEN_FONT_BODY: (v) => ({ fontBody: v }),
	CVGEN_MARGINS: (v) => ({ margins: v }),
};

/**
 * Load global config from project root.
 */
export async function loadGlobalConfig(
	projectRoot: string,
): Promise<StyleConfig | null> {
	const configPath = path.join(projectRoot, 'config.json');
	try {
		const content = await readFile(configPath, 'utf-8');
		const config = JSON.parse(content) as { style?: StyleConfig };
		return config.style ?? null;
	} catch {
		// Global config is optional
		return null;
	}
}

/**
 * Get config from environment variables.
 */
export function getEnvConfig(): StyleConfig {
	const config: StyleConfig = {};

	for (const [envKey, mapper] of Object.entries(ENV_MAPPINGS)) {
		const value = process.env[envKey];
		if (value) {
			Object.assign(config, mapper(value));
		}
	}

	return config;
}

/**
 * Deep merge style configs with proper priority.
 */
export function mergeStyleConfigs(
	...configs: (StyleConfig | undefined | null)[]
): StyleConfig {
	const result: StyleConfig = {};

	for (const config of configs) {
		if (!config) continue;

		if (config.accentColor) result.accentColor = config.accentColor;
		if (config.fontHeading) result.fontHeading = config.fontHeading;
		if (config.fontBody) result.fontBody = config.fontBody;
		if (config.margins !== undefined) result.margins = config.margins;

		// Deep merge colors
		if (config.colors) {
			result.colors = { ...result.colors, ...config.colors };
		}
	}

	return result;
}

/**
 * Resolve final style configuration with cascade.
 */
export function resolveStyle(
	templateConfig: TemplateConfig,
	globalConfig: StyleConfig | null,
	frontmatterConfig: StyleConfig | undefined,
	warnings: string[] = [],
): ResolvedStyle {
	const templateId = templateConfig.name.toLowerCase();

	// Get base palette for template
	const basePalette =
		DEFAULT_PALETTES[templateId] ??
		DEFAULT_PALETTES.modern ??
		getDefaultPalette();

	// Merge configs in cascade order
	const envConfig = getEnvConfig();
	const mergedStyle = mergeStyleConfigs(
		templateConfig.style as StyleConfig | undefined,
		globalConfig,
		envConfig,
		frontmatterConfig,
	);

	// Resolve margin
	const marginMm = resolveMargin(
		mergedStyle.margins as 'narrow' | 'normal' | 'wide' | number | undefined,
	);

	// Validate accent color
	let accentColor = basePalette.accent;
	if (mergedStyle.accentColor) {
		if (isValidHexColor(mergedStyle.accentColor)) {
			accentColor = mergedStyle.accentColor;
		} else {
			warnings.push(
				`Invalid accent color "${mergedStyle.accentColor}", using default`,
			);
		}
	}

	// Resolve fonts (validate they're reasonable font stack strings)
	const fontHeading = mergedStyle.fontHeading ?? 'Arial, Helvetica, sans-serif';
	const fontBody = mergedStyle.fontBody ?? 'Arial, Helvetica, sans-serif';

	// Merge colors with custom accent
	const colors = mergeColors(basePalette, {
		...mergedStyle.colors,
		accent: accentColor,
	});

	return {
		accentColor: colors.accent,
		fontHeading,
		fontBody,
		marginMm,
		marginCss: marginToCss(marginMm),
		colors,
	};
}

/**
 * Generate CSS custom property overrides from resolved style.
 */
export function styleToCssVariables(style: ResolvedStyle): string {
	return `:root {
  --color-accent: ${style.colors.accent};
  --color-heading: ${style.colors.heading};
  --color-body: ${style.colors.body};
  --color-muted: ${style.colors.muted};
  --color-border: ${style.colors.border};
  --color-background: ${style.colors.background};
  --color-surface: ${style.colors.surface};
  --font-heading: ${style.fontHeading};
  --font-body: ${style.fontBody};
  --page-margin: ${style.marginCss};
}`;
}

/**
 * Get a default color palette as fallback.
 */
function getDefaultPalette(): ColorPalette {
	return {
		accent: '#2563eb',
		heading: '#0f172a',
		body: '#1e293b',
		muted: '#64748b',
		border: '#e2e8f0',
		background: '#ffffff',
		surface: '#f8fafc',
	};
}
