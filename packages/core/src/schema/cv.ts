import type { Certification } from './certification.ts';
import type { Contact } from './contact.ts';
import type { Education } from './education.ts';
import type { WorkExperience } from './experience.ts';
import type { Localized } from './localized.ts';
import type { Project } from './project.ts';
import type { SkillCategory } from './skills.ts';

/**
 * Complete CV data structure.
 * Contact is not localized (same across all languages).
 * Body sections are localized for multi-language support.
 */
export interface CVData {
	/** Contact information (from frontmatter, not localized) */
	contact: Contact;

	/** Professional summary/objective (localized) */
	summary?: Localized<string>;

	/** Work experience entries (localized) */
	experience?: Localized<WorkExperience[]>;

	/** Education entries (localized) */
	education?: Localized<Education[]>;

	/** Skills by category (localized) */
	skills?: Localized<SkillCategory[]>;

	/** Projects portfolio (localized) */
	projects?: Localized<Project[]>;

	/** Professional certifications (NOT localized - cert names are universal) */
	certifications?: Certification[];
}
