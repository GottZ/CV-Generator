/**
 * Zod schema for Summarize stage structured output.
 * Per RESEARCH.md: Generate professional summary options.
 */

import { z } from 'zod';

/**
 * Complete Summarize stage output schema.
 * Provides primary and alternative professional summaries.
 */
export const SummarizeOutputSchema = z.object({
	primary: z.string().describe('Primary professional summary (2-3 sentences)'),
	alternative: z
		.string()
		.optional()
		.describe('Alternative summary with different angle'),
	keyPoints: z.array(z.string()).describe('Key career highlights to emphasize'),
	targetRoles: z
		.array(z.string())
		.optional()
		.describe('Roles this summary positions for'),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;
