/**
 * Zod schema for Tailor stage structured output.
 * Per RESEARCH.md: Job-specific tailoring with keyword analysis.
 */

import { z } from 'zod';

/**
 * Schema for keyword suggestion.
 */
const KeywordSuggestionSchema = z.object({
	keyword: z.string(),
	where: z.string().describe('Which section to add this keyword'),
	how: z.string().describe('Suggested phrasing'),
});

/**
 * Schema for keyword analysis.
 */
const KeywordAnalysisSchema = z.object({
	present: z
		.array(z.string())
		.describe('Keywords from job posting found in CV'),
	missing: z.array(z.string()).describe('Important keywords missing from CV'),
	suggestions: z.array(KeywordSuggestionSchema),
});

/**
 * Schema for tailored bullet replacement.
 */
const TailoredBulletSchema = z.object({
	section: z.string(),
	original: z.string(),
	tailored: z.string(),
	reason: z.string(),
});

/**
 * Complete Tailor stage output schema.
 * Provides job-specific tailoring analysis and suggestions.
 */
export const TailorOutputSchema = z.object({
	matchScore: z.number().min(0).max(100).describe('Overall match percentage'),
	keywordAnalysis: KeywordAnalysisSchema,
	tailoredSummary: z
		.string()
		.describe('Summary rewritten for this specific job'),
	tailoredBullets: z.array(TailoredBulletSchema).optional(),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type TailorOutput = z.infer<typeof TailorOutputSchema>;
