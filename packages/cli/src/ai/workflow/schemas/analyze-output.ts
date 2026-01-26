/**
 * Zod schema for Analyze stage structured output.
 * Per RESEARCH.md: Define expected LLM output shape for type-safe results.
 */

import { z } from 'zod';

/**
 * Schema for CV section analysis.
 */
const SectionAnalysisSchema = z.object({
	name: z
		.string()
		.describe('Section heading from CV (e.g., "Experience", "Education")'),
	status: z.enum(['strong', 'needs_improvement', 'missing']),
	bulletCount: z.number().describe('Number of bullet points in this section'),
	issues: z.array(z.string()).describe('Specific problems identified'),
});

/**
 * Schema for prioritized improvement item.
 */
const PrioritySchema = z.object({
	section: z.string(),
	issue: z.string(),
	impact: z.enum(['high', 'medium', 'low']),
});

/**
 * Complete Analyze stage output schema.
 * Provides structured analysis of CV sections, gaps, and improvement priorities.
 */
export const AnalyzeOutputSchema = z.object({
	sections: z
		.array(SectionAnalysisSchema)
		.describe('Analysis of each CV section'),
	gaps: z.array(z.string()).describe('Missing information or unexplained gaps'),
	priorities: z.array(PrioritySchema).describe('Ranked improvement priorities'),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type AnalyzeOutput = z.infer<typeof AnalyzeOutputSchema>;
