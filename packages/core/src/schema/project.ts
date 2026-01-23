/**
 * Project link with URL and optional type/label.
 */
export interface ProjectLink {
	/** Link URL (required) */
	url: string;
	/** Link type: github, demo, npm, docs, etc. */
	type?: string;
	/** Display name (overrides auto-formatting if provided) */
	label?: string;
}

/**
 * Single project entry.
 * Per CONTEXT.md: Name only required; all other fields optional.
 */
export interface Project {
	/** Project name (required) */
	name: string;
	/** Project description */
	description?: string;
	/** Technologies used */
	techStack?: string[];
	/** Project links (GitHub, demo, etc.) */
	links?: ProjectLink[];
	/** Project outcome/result */
	outcome?: string;
	/** Role on project (e.g., "Lead Developer", "Contributor") */
	role?: string;
	/** Project type: personal, professional, open-source, freelance */
	type?: 'personal' | 'professional' | 'open-source' | 'freelance';
	/** Start date (ISO format) */
	startDate?: string;
	/** End date (ISO format, or "present") */
	endDate?: string;
	/** Highlight flag for promoting to top of list */
	highlight?: boolean;
}
