/**
 * Format generated content as cv.md compatible output.
 * Source: RESEARCH.md "cv.md Output Formatting" example
 */

/**
 * STAR method breakdown for achievement bullets.
 */
export interface StarBreakdown {
	/** Context or challenge faced */
	situation: string;
	/** Your specific responsibility */
	task: string;
	/** Actions you took */
	action: string;
	/** Measurable outcome achieved */
	result: string;
}

/**
 * A single achievement bullet point.
 */
export interface RoleBullet {
	/** The complete bullet point text */
	text: string;
	/** STAR breakdown if requested */
	starBreakdown?: StarBreakdown;
	/** Quantifiable metrics in the bullet */
	metrics?: string[];
	/** Quality assessment */
	quality?: 'strong' | 'good' | 'needs_review';
}

/**
 * Achievement bullets for a single role/position.
 */
export interface RoleBullets {
	/** Company name */
	company: string;
	/** Job title/role */
	role: string;
	/** Start date (YYYY-MM format) */
	startDate: string;
	/** End date (YYYY-MM format) or null if current */
	endDate: string | null;
	/** Achievement bullets for this role */
	bullets: RoleBullet[];
}

/**
 * Options for formatting bullets as cv.md.
 */
export interface FormatBulletsOptions {
	/** Include STAR breakdown as markdown comments */
	showStar?: boolean;
}

/**
 * Format achievement bullets as cv.md Work Experience section.
 *
 * Produces markdown output compatible with cv.md format:
 * - Section header with locale tag
 * - Role headers with company and dates
 * - Bullet points with optional STAR comments
 *
 * @param roles - Array of roles with their bullets
 * @param locale - Locale code for section header (e.g., 'en', 'de')
 * @param options - Formatting options
 * @returns cv.md formatted string
 *
 * @example
 * ```typescript
 * const output = formatBulletsAsCvMd([{
 *   company: 'TechCorp',
 *   role: 'Senior Engineer',
 *   startDate: '2020-03',
 *   endDate: null,
 *   bullets: [{ text: 'Led migration to microservices' }]
 * }], 'en');
 * // ## Work Experience `en`
 * // ---
 * // ### Senior Engineer at TechCorp
 * // *2020-03 - present*
 * // - Led migration to microservices
 * ```
 */
export function formatBulletsAsCvMd(
	roles: RoleBullets[],
	locale: string,
	options: FormatBulletsOptions = {},
): string {
	const lines: string[] = [];
	const { showStar = false } = options;

	lines.push(`## Work Experience \`${locale}\``);
	lines.push('');

	for (const role of roles) {
		lines.push('---');
		lines.push(`### ${role.role} at ${role.company}`);
		lines.push(`*${role.startDate} - ${role.endDate || 'present'}*`);
		lines.push('');

		for (const bullet of role.bullets) {
			lines.push(`- ${bullet.text}`);

			// Include STAR as markdown comments if showStar
			if (showStar && bullet.starBreakdown) {
				lines.push('<!-- STAR:');
				lines.push(`  S: ${bullet.starBreakdown.situation}`);
				lines.push(`  T: ${bullet.starBreakdown.task}`);
				lines.push(`  A: ${bullet.starBreakdown.action}`);
				lines.push(`  R: ${bullet.starBreakdown.result}`);
				lines.push('-->');
			}
		}
		lines.push('');
	}

	return lines.join('\n');
}

/**
 * Format a professional summary as cv.md Summary section.
 *
 * @param summary - The summary text
 * @param locale - Locale code for section header (e.g., 'en', 'de')
 * @returns cv.md formatted string
 *
 * @example
 * ```typescript
 * const output = formatSummaryAsCvMd(
 *   'Senior Software Engineer with 8+ years...',
 *   'en'
 * );
 * // ## Summary `en`
 * //
 * // Senior Software Engineer with 8+ years...
 * ```
 */
export function formatSummaryAsCvMd(summary: string, locale: string): string {
	const lines: string[] = [];

	lines.push(`## Summary \`${locale}\``);
	lines.push('');
	lines.push(summary);
	lines.push('');

	return lines.join('\n');
}

/**
 * Keyword placement suggestion.
 */
export interface KeywordPlacement {
	/** The keyword to place */
	keyword: string;
	/** CV section to place it in */
	section: string;
	/** Rewritten content with keyword integrated */
	rewrittenContent: string;
	/** Optional: original content before rewrite */
	originalContent?: string;
	/** Optional: context lines around the change */
	context?: string;
}

/**
 * Format keyword placement suggestions as cv.md comments/annotations.
 *
 * @param keywords - Array of keyword placement suggestions
 * @param locale - Locale code for context
 * @returns Formatted string with suggestions
 *
 * @example
 * ```typescript
 * const output = formatKeywordsAsCvMd([{
 *   keyword: 'TypeScript',
 *   section: 'Skills',
 *   rewrittenContent: '- TypeScript (expert)'
 * }], 'en');
 * ```
 */
export function formatKeywordsAsCvMd(
	keywords: KeywordPlacement[],
	locale: string,
): string {
	const lines: string[] = [];

	lines.push(`## Keyword Suggestions \`${locale}\``);
	lines.push('');

	// Group by section
	const bySection = new Map<string, KeywordPlacement[]>();
	for (const kw of keywords) {
		const existing = bySection.get(kw.section) || [];
		existing.push(kw);
		bySection.set(kw.section, existing);
	}

	for (const [section, placements] of bySection) {
		lines.push(`### ${section}`);
		lines.push('');

		for (const placement of placements) {
			lines.push(`**${placement.keyword}:**`);

			if (placement.originalContent) {
				lines.push(`- Original: ${placement.originalContent}`);
			}

			lines.push(`- Suggested: ${placement.rewrittenContent}`);

			if (placement.context) {
				lines.push('');
				lines.push('```');
				lines.push(placement.context);
				lines.push('```');
			}

			lines.push('');
		}
	}

	return lines.join('\n');
}

/**
 * Format a complete cv.md document from multiple sections.
 *
 * @param sections - Object with optional summary, experience, and keywords
 * @returns Complete cv.md formatted document
 */
export function formatCompleteCvMd(sections: {
	summary?: { text: string; locale: string };
	experience?: { roles: RoleBullets[]; locale: string; showStar?: boolean };
	keywords?: { placements: KeywordPlacement[]; locale: string };
}): string {
	const parts: string[] = [];

	if (sections.summary) {
		parts.push(
			formatSummaryAsCvMd(sections.summary.text, sections.summary.locale),
		);
	}

	if (sections.experience) {
		parts.push(
			formatBulletsAsCvMd(
				sections.experience.roles,
				sections.experience.locale,
				{ showStar: sections.experience.showStar },
			),
		);
	}

	if (sections.keywords) {
		parts.push(
			formatKeywordsAsCvMd(
				sections.keywords.placements,
				sections.keywords.locale,
			),
		);
	}

	return parts.join('\n');
}
