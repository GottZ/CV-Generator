/**
 * Standalone AI content generators.
 *
 * These generators are distinct from the workflow stages and can be
 * used independently for specific content generation tasks.
 *
 * @module ai/generators
 */

// Bullet generation (AI-06)
export { type BulletsOptions, generateBullets } from './bullets.ts';
// Standalone improve generator with priority grouping
export {
	generateImprovements,
	type Improvement,
	type ImprovementsOutput,
	ImprovementsOutputSchema,
} from './improve-standalone.ts';
// Keyword analysis generator (AI-08)
export { analyzeKeywords, type KeywordsOptions } from './keywords.ts';
export { generateSummary, type SummaryOptions } from './summary.ts';
// Standalone tailor generator
export { tailorCV } from './tailor-standalone.ts';
