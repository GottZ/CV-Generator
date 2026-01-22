// Engine
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
	TemplateConfig,
} from './types.ts';
