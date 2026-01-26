/**
 * Registry of available AI prompts.
 * Each prompt maps to a Nunjucks template file.
 */

export interface PromptMetadata {
	name: string;
	description: string;
	stage: number; // 1-4 for the multi-stage workflow
	requiresCV: boolean;
	requiresJobDescription: boolean;
	templateFile: string;
}

/**
 * Available prompts indexed by name.
 * Phase 14 defines templates; Phase 15 implements the multi-stage workflow.
 */
export const PROMPTS: Record<string, PromptMetadata> = {
	analyze: {
		name: 'analyze',
		description:
			'Analyze CV structure, identify gaps, and find improvement opportunities',
		stage: 1,
		requiresCV: true,
		requiresJobDescription: false,
		templateFile: 'analyze.njk',
	},
	improve: {
		name: 'improve',
		description: 'Generate improved achievement bullets using STAR method',
		stage: 2,
		requiresCV: true,
		requiresJobDescription: false,
		templateFile: 'improve.njk',
	},
	summarize: {
		name: 'summarize',
		description: 'Generate professional summary from CV content',
		stage: 3,
		requiresCV: true,
		requiresJobDescription: false,
		templateFile: 'summarize.njk',
	},
	tailor: {
		name: 'tailor',
		description: 'Adapt CV content for a specific job description',
		stage: 4,
		requiresCV: true,
		requiresJobDescription: true,
		templateFile: 'tailor.njk',
	},
	'summary-gen': {
		name: 'summary-gen',
		description: 'Standalone summary generator (AI-07) - not part of workflow',
		stage: 0, // Standalone, not workflow stage
		requiresCV: false, // Uses cv_content string, not CV object
		requiresJobDescription: false,
		templateFile: 'summary-gen.njk',
	},
	keywords: {
		name: 'keywords',
		description: 'Analyze ATS keywords and suggest placements (AI-08)',
		stage: 0, // Standalone, not workflow stage
		requiresCV: true,
		requiresJobDescription: true,
		templateFile: 'keywords.njk',
	},
	bullets: {
		name: 'bullets',
		description:
			'Generate STAR-formatted achievement bullets for work experience (AI-06)',
		stage: 0, // Standalone generator, not part of workflow stages
		requiresCV: true,
		requiresJobDescription: false,
		templateFile: 'bullets.njk',
	},
	'improve-standalone': {
		name: 'improve-standalone',
		description:
			'Standalone improvement analyzer (AI-09) - not part of workflow',
		stage: 0, // Standalone, not workflow stage
		requiresCV: false, // Uses cv_content string, not CV object
		requiresJobDescription: false,
		templateFile: 'improve-standalone.njk',
	},
};

/**
 * Get list of all available prompts.
 */
export function getPromptList(): PromptMetadata[] {
	return Object.values(PROMPTS);
}

/**
 * Get prompt metadata by name.
 */
export function getPromptByName(name: string): PromptMetadata | undefined {
	return PROMPTS[name];
}

/**
 * Get prompts filtered by stage.
 */
export function getPromptsByStage(stage: number): PromptMetadata[] {
	return getPromptList().filter((p) => p.stage === stage);
}

/**
 * Check if a prompt name is valid.
 */
export function isValidPrompt(name: string): boolean {
	return name in PROMPTS;
}
