/**
 * Wizard prompt flows index.
 * Exports all section-specific prompt collection functions.
 */

// Contact information prompts
export { collectContact, collectLinks } from './contact.ts';

// Work experience prompts
export {
	collectBullets,
	collectExperience,
	collectSingleExperience,
	collectTechStack,
} from './experience.ts';
