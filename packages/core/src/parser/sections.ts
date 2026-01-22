import type { ParseError } from '../schema/index.ts';

/**
 * Matched section from markdown body.
 */
export interface SectionMatch {
	/** Section header text (e.g., "Work Experience", "Berufserfahrung") */
	header: string;
	/** Normalized section type (e.g., "summary", "experience", "education", "skills") */
	sectionType: string;
	/** Language code from backtick notation (e.g., "en", "de") */
	language: string;
	/** Raw content between this header and the next */
	content: string;
	/** Line number where section starts (1-indexed) */
	line: number;
}

interface SectionsResult {
	sections: SectionMatch[];
	warnings: ParseError[];
}

/** Known section types and their normalized names */
const SECTION_MAPPINGS: Record<string, string> = {
	// English
	summary: 'summary',
	'professional summary': 'summary',
	objective: 'summary',
	'work experience': 'experience',
	experience: 'experience',
	employment: 'experience',
	education: 'education',
	skills: 'skills',
	'technical skills': 'skills',

	// German
	zusammenfassung: 'summary',
	profil: 'summary',
	berufserfahrung: 'experience',
	'beruflicher werdegang': 'experience',
	ausbildung: 'education',
	bildung: 'education',
	kenntnisse: 'skills',
	fachkenntnisse: 'skills',
};

/**
 * Extract sections with language tags from markdown body.
 * Sections must use format: ## Header `lang`
 *
 * Per CONTEXT.md: Language tags are required on every section.
 * Unknown sections trigger warning but are included for forward compatibility.
 */
export function extractSections(markdown: string): SectionsResult {
	const warnings: ParseError[] = [];
	const sections: SectionMatch[] = [];

	// Split into lines for line number tracking
	const lines = markdown.split('\n');

	// Match ## Header `lang` pattern
	// Captures: header text (group 1), language code (group 2)
	const sectionRegex = /^##\s+(.+?)\s+`(\w+)`\s*$/;

	let currentSection: Partial<SectionMatch> | null = null;
	let contentLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const lineNum = i + 1; // 1-indexed

		const match = line.match(sectionRegex);

		if (match) {
			// Save previous section if exists
			if (currentSection?.header) {
				currentSection.content = contentLines.join('\n').trim();
				sections.push(currentSection as SectionMatch);
			}

			const header = (match[1] ?? '').trim();
			const language = (match[2] ?? '').toLowerCase();
			const normalizedType = normalizeSection(header);

			// Warn about unknown sections (DATA-10)
			if (!normalizedType) {
				warnings.push({
					type: 'warning',
					line: lineNum,
					message: `Unknown section type: "${header}"`,
					suggestion: `Known sections: Summary, Work Experience, Education, Skills`,
					context: line,
				});
			}

			currentSection = {
				header,
				sectionType: normalizedType || 'unknown',
				language,
				line: lineNum,
			};
			contentLines = [];
		} else if (currentSection) {
			contentLines.push(line);
		}
		// Lines before first section are ignored (typically just whitespace)
	}

	// Don't forget last section
	if (currentSection?.header) {
		currentSection.content = contentLines.join('\n').trim();
		sections.push(currentSection as SectionMatch);
	}

	// Check for sections without language tags (lines starting with ## but no backtick)
	const untaggedRegex = /^##\s+(.+?)(?:\s*)$/;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		if (line.match(untaggedRegex) && !line.includes('`')) {
			warnings.push({
				type: 'warning',
				line: i + 1,
				message: `Section header missing language tag: "${line.trim()}"`,
				suggestion: 'Add language tag, e.g., ## Work Experience `en`',
				context: line,
			});
		}
	}

	return { sections, warnings };
}

/**
 * Normalize section header to standard type.
 * Returns null for unknown sections.
 */
function normalizeSection(header: string): string | null {
	const normalized = header.toLowerCase().trim();
	return SECTION_MAPPINGS[normalized] || null;
}
