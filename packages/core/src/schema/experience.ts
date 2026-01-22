/**
 * Single work experience entry.
 * Dates are ISO format strings (YYYY-MM-DD or YYYY-MM).
 */
export interface WorkExperience {
	/** Company/organization name */
	company: string;
	/** Job title/role */
	role: string;
	/** Start date in ISO format (YYYY-MM or YYYY-MM-DD) */
	startDate: string;
	/** End date in ISO format, or 'present' for current job */
	endDate: string;
	/** Location (city, country) */
	location?: string;
	/** Achievement/responsibility bullet points (markdown supported) */
	bullets: string[];
	/** Tech stack used in this role (added in Phase 7, optional here) */
	techStack?: string[];
}
