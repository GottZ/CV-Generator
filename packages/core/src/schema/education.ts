/**
 * Education entry supporting both university degrees and German Ausbildung.
 */
export interface Education {
	/** Institution name (university, school, training company) */
	institution: string;
	/** Degree type or certification (e.g., "B.Sc.", "Fachinformatiker", "MBA") */
	degree: string;
	/** Field of study (e.g., "Computer Science", "Anwendungsentwicklung") */
	field?: string;
	/** Start date in ISO format */
	startDate: string;
	/** End date in ISO format */
	endDate: string;
	/** Location */
	location?: string;
	/** GPA or honors (optional, not emphasized for established professionals) */
	honors?: string;
	/** Additional notes or achievements */
	notes?: string;
}
