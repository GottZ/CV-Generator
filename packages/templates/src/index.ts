// Engine

export type { ColorPalette } from './config/index.ts';
// Config
export {
	DEFAULT_PALETTES,
	getEnvConfig,
	isValidHexColor,
	loadGlobalConfig,
	marginToCss,
	mergeColors,
	mergeStyleConfigs,
	NAMED_MARGINS,
	resolveMargin,
	resolveStyle,
	styleToCssVariables,
} from './config/index.ts';
export {
	createTemplateEnvironment,
	discoverTemplates,
	getTemplate,
} from './engine/index.ts';
// i18n
export { getSectionHeader, sectionHeaders } from './i18n/index.ts';
// Render
export { createRenderer, renderCV } from './render.ts';

// Types
export type {
	DiscoveredTemplate,
	RenderOptions,
	RenderResult,
	ResolvedStyle,
	StyleConfig,
	TemplateConfig,
} from './types.ts';
