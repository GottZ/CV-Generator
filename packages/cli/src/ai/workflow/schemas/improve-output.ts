/**
 * Zod schema for Improve stage structured output.
 * Per RESEARCH.md: Structured output for bullet improvements using STAR method.
 */

import { z } from 'zod';

/**
 * Schema for a single bullet improvement.
 */
const BulletImprovementSchema = z.object({
	original: z.string().describe('The original bullet text'),
	improved: z.string().describe('The improved bullet using STAR method'),
	reasoning: z.string().describe('Why this improvement is better'),
	metrics: z
		.array(z.string())
		.optional()
		.describe('Quantifiable metrics added'),
});

/**
 * Schema for job-level improvements.
 */
const JobImprovementSchema = z.object({
	company: z.string(),
	role: z.string(),
	bullets: z.array(BulletImprovementSchema),
});

/**
 * Complete Improve stage output schema.
 * Provides structured improvements for experience bullets.
 */
export const ImproveOutputSchema = z.object({
	jobImprovements: z.array(JobImprovementSchema),
	overallNotes: z.string().optional(),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type ImproveOutput = z.infer<typeof ImproveOutputSchema>;
