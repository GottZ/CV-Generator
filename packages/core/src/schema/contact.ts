/**
 * External link with type identifier.
 * Type can be: 'linkedin', 'github', 'website', 'twitter', etc.
 */
export interface Link {
	type: string;
	url: string;
	/** Optional display label (defaults to type name) */
	label?: string;
}

/**
 * Contact information from frontmatter.
 * All fields except name are optional for flexibility.
 */
export interface Contact {
	/** Full name (required) */
	name: string;
	/** Email address */
	email?: string;
	/** Phone number (stored as string to preserve formatting) */
	phone?: string;
	/** Location (city, country format typical) */
	location?: string;
	/** External profile links */
	links?: Link[];
	/** Optional slug for filename (defaults to directory name) */
	slug?: string;
	/** Optional photo path (relative to person directory) */
	photo?: string;
}
