/**
 * Zod schema for keyword analysis output.
 * Source: RESEARCH.md "Keyword Analysis Output Schema"
 */

import { z } from 'zod';

const KeywordEntrySchema = z.object({
	keyword: z.string(),
	found: z.boolean(),
	suggestedPlacement: z
		.string()
		.optional()
		.describe('Which CV section this keyword should appear in'),
	rewrittenContent: z
		.string()
		.optional()
		.describe('Suggested rewrite integrating the keyword'),
	context: z.string().optional().describe('2-3 lines of surrounding context'),
});

const SectionSuggestionsSchema = z.object({
	section: z.string().describe('CV section: skills, experience, summary'),
	suggestions: z.array(
		z.object({
			keyword: z.string(),
			currentText: z.string().optional(),
			rewrittenText: z.string(),
			context: z.string().describe('2-3 lines surrounding context'),
		}),
	),
});

export const KeywordsOutputSchema = z.object({
	score: z
		.number()
		.min(0)
		.max(100)
		.describe('Overall keyword coverage percentage'),

	byCategory: z.object({
		required: z.object({
			total: z.number(),
			matched: z.number(),
			keywords: z.array(KeywordEntrySchema),
		}),
		preferred: z.object({
			total: z.number(),
			matched: z.number(),
			keywords: z.array(KeywordEntrySchema),
		}),
	}),

	bySection: z.array(SectionSuggestionsSchema),

	highCoverage: z.boolean().describe('True if score > 90%'),

	summary: z.string().describe('Brief summary of keyword coverage status'),
});

export type KeywordsOutput = z.infer<typeof KeywordsOutputSchema>;
