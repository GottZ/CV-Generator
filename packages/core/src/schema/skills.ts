/**
 * Individual skill with optional proficiency.
 */
export interface Skill {
	/** Skill name (e.g., "TypeScript", "Kubernetes (K8s)") */
	name: string;
	/** Optional proficiency level (e.g., "expert", "proficient", "familiar") */
	level?: string;
}

/**
 * Category grouping related skills.
 * Categories from requirements: languages, frameworks, databases, cloud, tools.
 */
export interface SkillCategory {
	/** Category name (e.g., "Languages", "Cloud", "Tools") */
	name: string;
	/** Skills within this category */
	skills: Skill[];
}
