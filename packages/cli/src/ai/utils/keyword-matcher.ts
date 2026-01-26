/**
 * ATS keyword matching with fuzzy and exact modes.
 * Source: RESEARCH.md Pattern 3
 */

import Fuse from 'fuse.js';

/**
 * Result of matching a single keyword against CV content.
 */
export interface KeywordMatch {
	/** The keyword being matched */
	keyword: string;
	/** Whether the keyword was found in the CV */
	found: boolean;
	/** How the keyword was matched */
	matchType: 'exact' | 'fuzzy' | 'not_found';
	/** The text in the CV that matched (if found) */
	matchedText?: string;
	/** The CV section containing the match (if found) */
	section?: string;
	/** Match confidence (0-1, where 1 is exact match) */
	confidence: number;
}

/**
 * Options for keyword matching.
 */
export interface MatchKeywordsOptions {
	/** Use exact matching instead of fuzzy (default: false) */
	exact?: boolean;
}

/**
 * A section of the CV for context-aware matching.
 */
export interface CVSection {
	/** Section name (e.g., "Skills", "Experience", "Education") */
	name: string;
	/** Section content */
	content: string;
}

/**
 * Common skill synonyms for enhanced matching.
 * Handles abbreviations and common variations.
 */
const SKILL_SYNONYMS: Record<string, string[]> = {
	javascript: ['js', 'ecmascript', 'es6', 'es2015', 'es2017', 'es2020'],
	typescript: ['ts'],
	kubernetes: ['k8s'],
	'machine learning': ['ml'],
	'artificial intelligence': ['ai'],
	'project management': ['pm', 'program coordination'],
	'amazon web services': ['aws'],
	'google cloud platform': ['gcp', 'google cloud'],
	'microsoft azure': ['azure'],
	continuous: ['ci', 'cd', 'ci/cd', 'cicd'],
	database: ['db', 'dbs'],
	postgresql: ['postgres', 'psql'],
	mongodb: ['mongo'],
	elasticsearch: ['elastic', 'es'],
};

/**
 * Match job description keywords against CV content.
 *
 * @param jobKeywords - Keywords extracted from job description
 * @param cvText - Full CV text for matching
 * @param cvSections - CV sections for context reporting
 * @param options - Matching options
 * @returns Array of match results for each keyword
 *
 * @example
 * ```typescript
 * const keywords = ['React', 'TypeScript', 'AWS'];
 * const matches = matchKeywords(keywords, cvText, sections);
 * const coverage = matches.filter(m => m.found).length / matches.length;
 * ```
 */
export function matchKeywords(
	jobKeywords: string[],
	cvText: string,
	cvSections: CVSection[],
	options: MatchKeywordsOptions = {},
): KeywordMatch[] {
	if (options.exact) {
		return matchExact(jobKeywords, cvText, cvSections);
	}
	return matchFuzzy(jobKeywords, cvText, cvSections);
}

/**
 * Perform exact case-insensitive matching with word boundaries.
 */
function matchExact(
	keywords: string[],
	cvText: string,
	sections: CVSection[],
): KeywordMatch[] {
	const normalizedCvText = cvText.toLowerCase();

	return keywords.map((keyword) => {
		// Try direct match first
		const directMatch = matchExactKeyword(keyword, normalizedCvText);
		if (directMatch) {
			return {
				keyword,
				found: true,
				matchType: 'exact' as const,
				matchedText: keyword,
				section: findSection(sections, keyword),
				confidence: 1.0,
			};
		}

		// Try synonym matches
		const synonymMatch = matchSynonyms(keyword, normalizedCvText);
		if (synonymMatch) {
			return {
				keyword,
				found: true,
				matchType: 'exact' as const,
				matchedText: synonymMatch,
				section: findSection(sections, synonymMatch),
				confidence: 0.9, // Slightly lower for synonym match
			};
		}

		return {
			keyword,
			found: false,
			matchType: 'not_found' as const,
			confidence: 0,
		};
	});
}

/**
 * Check if a keyword matches exactly (case-insensitive, word boundary).
 */
function matchExactKeyword(keyword: string, normalizedText: string): boolean {
	const escaped = escapeRegex(keyword.toLowerCase());
	const regex = new RegExp(`\\b${escaped}\\b`, 'i');
	return regex.test(normalizedText);
}

/**
 * Try to match using synonym mappings.
 */
function matchSynonyms(keyword: string, normalizedText: string): string | null {
	const normalizedKeyword = keyword.toLowerCase();

	// Check if keyword is a known term with synonyms
	const synonyms = SKILL_SYNONYMS[normalizedKeyword];
	if (synonyms) {
		for (const synonym of synonyms) {
			if (matchExactKeyword(synonym, normalizedText)) {
				return synonym;
			}
		}
	}

	// Check if keyword is a synonym of a known term
	for (const [term, synonymList] of Object.entries(SKILL_SYNONYMS)) {
		if (synonymList.includes(normalizedKeyword)) {
			// Check if the main term is in the text
			if (matchExactKeyword(term, normalizedText)) {
				return term;
			}
			// Also check other synonyms
			for (const otherSynonym of synonymList) {
				if (
					otherSynonym !== normalizedKeyword &&
					matchExactKeyword(otherSynonym, normalizedText)
				) {
					return otherSynonym;
				}
			}
		}
	}

	return null;
}

/**
 * Perform fuzzy matching using Fuse.js.
 */
function matchFuzzy(
	keywords: string[],
	cvText: string,
	sections: CVSection[],
): KeywordMatch[] {
	// Extract tokens from CV text for fuzzy matching
	const tokens = extractTokens(cvText);

	// Create Fuse instance with 0.3 threshold (per RESEARCH.md)
	const fuse = new Fuse(tokens, {
		threshold: 0.3, // Lower = stricter matching
		distance: 100,
		includeScore: true,
		ignoreLocation: true, // Match anywhere in token
	});

	return keywords.map((keyword) => {
		// Try exact match first (higher confidence)
		const normalizedCvText = cvText.toLowerCase();
		if (matchExactKeyword(keyword, normalizedCvText)) {
			return {
				keyword,
				found: true,
				matchType: 'exact' as const,
				matchedText: keyword,
				section: findSection(sections, keyword),
				confidence: 1.0,
			};
		}

		// Try synonym match
		const synonymMatch = matchSynonyms(keyword, normalizedCvText);
		if (synonymMatch) {
			return {
				keyword,
				found: true,
				matchType: 'exact' as const,
				matchedText: synonymMatch,
				section: findSection(sections, synonymMatch),
				confidence: 0.9,
			};
		}

		// Fall back to fuzzy matching
		const results = fuse.search(keyword);
		const bestMatch = results[0];

		if (bestMatch && (bestMatch.score ?? 1) < 0.3) {
			return {
				keyword,
				found: true,
				matchType: 'fuzzy' as const,
				matchedText: bestMatch.item,
				section: findSection(sections, bestMatch.item),
				confidence: 1 - (bestMatch.score ?? 1),
			};
		}

		return {
			keyword,
			found: false,
			matchType: 'not_found' as const,
			confidence: 0,
		};
	});
}

/**
 * Extract meaningful tokens from text for fuzzy matching.
 * Splits on whitespace and punctuation, filters short tokens.
 */
function extractTokens(text: string): string[] {
	// Split on non-alphanumeric characters (except hyphens in words)
	const tokens = text
		.toLowerCase()
		.split(/[\s,;:()[\]{}|/\\]+/)
		.filter((token) => token.length >= 2) // Filter very short tokens
		.map((token) => token.trim())
		.filter((token) => token.length > 0);

	// Remove duplicates while preserving order
	return [...new Set(tokens)];
}

/**
 * Find which CV section contains the matched text.
 */
function findSection(
	sections: CVSection[],
	matchedText: string,
): string | undefined {
	const normalizedMatch = matchedText.toLowerCase();

	for (const section of sections) {
		if (section.content.toLowerCase().includes(normalizedMatch)) {
			return section.name;
		}
	}

	return undefined;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
