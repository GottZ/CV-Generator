/**
 * Wizard prompt flows index.
 * Exports all section-specific prompt collection functions.
 */

// Contact information prompts
export { collectContact, collectLinks } from './contact.ts';

// Education prompts
export { collectEducation, collectSingleEducation } from './education.ts';

// Work experience prompts
export {
	collectBullets,
	collectExperience,
	collectSingleExperience,
	collectTechStack,
} from './experience.ts';

// Skills prompts
export {
	collectSingleSkillCategory,
	collectSkills,
	collectSkillsInCategory,
} from './skills.ts';

// Projects prompts
export { collectProjects, collectSingleProject } from './projects.ts';
