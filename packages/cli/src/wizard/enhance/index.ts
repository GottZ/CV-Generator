/**
 * Wizard enhance module public API.
 * Provides AI enhancement for wizard sections and STAR method guidance.
 */

// API key input (WIZ-11)
export { promptApiKey } from './api-key-prompt.js';
// Section enhancement (WIZ-20)
export {
	type EnhanceableSection,
	type EnhanceOptions,
	enhanceSection,
} from './section-enhancer.js';
// STAR method prompts (WIZ-19)
export {
	detectRoleType,
	getStarGuidance,
	type RoleType,
	STAR_EXAMPLES,
	showStarExample,
} from './star-prompts.js';
