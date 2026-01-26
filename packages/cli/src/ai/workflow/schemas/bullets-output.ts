/**
 * Zod schema for bullet generation output.
 * Source: RESEARCH.md Pattern 2 "STAR Method Bullet Schema"
 */

import { z } from 'zod';

const STARBreakdownSchema = z.object({
	situation: z.string().describe('Context or challenge faced'),
	task: z.string().describe('Your specific responsibility'),
	action: z.string().describe('Actions you took'),
	result: z.string().describe('Measurable outcome achieved'),
});

const BulletSchema = z.object({
	text: z.string().describe('The complete bullet point (40 words max)'),
	starBreakdown: STARBreakdownSchema.optional().describe(
		'STAR breakdown, included if showStar option used',
	),
	metrics: z
		.array(z.string())
		.optional()
		.describe('Quantifiable metrics in the bullet'),
	keywords: z
		.array(z.string())
		.optional()
		.describe('ATS-relevant keywords used'),
	quality: z
		.enum(['strong', 'good', 'needs_review'])
		.describe('Quality assessment'),
});

const RoleBulletsSchema = z.object({
	company: z.string(),
	role: z.string(),
	startDate: z.string(),
	endDate: z.string().nullable(),
	bullets: z.array(BulletSchema),
	bulletCountReasoning: z
		.string()
		.describe('Why this number of bullets (tenure + seniority + scope)'),
});

export const BulletsOutputSchema = z.object({
	roles: z.array(RoleBulletsSchema),
	overallQuality: z.enum(['strong', 'good', 'needs_review']),
});

export type BulletsOutput = z.infer<typeof BulletsOutputSchema>;
export type RoleBullets = z.infer<typeof RoleBulletsSchema>;
export type Bullet = z.infer<typeof BulletSchema>;
