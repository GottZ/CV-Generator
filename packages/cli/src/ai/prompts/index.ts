/**
 * Prompt template rendering system.
 * Uses Nunjucks (same as CV templates) for prompt interpolation.
 * Per RESEARCH.md Pattern 3: Use existing Nunjucks environment patterns.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CVData } from '@gottz/cv-core';
import nunjucks from 'nunjucks';
import { getPromptByName, type PromptMetadata } from './registry.ts';

export type { PromptMetadata } from './registry.ts';
export {
	getPromptByName,
	getPromptList,
	getPromptsByStage,
	isValidPrompt,
	PROMPTS,
} from './registry.ts';

// Get directory of this file for template resolution
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * Context passed to prompt templates.
 */
export interface PromptContext {
	cv: CVData;
	locale: string;
	jobDescription?: string;
	previousAnalysis?: string; // For stage 2+
	options?: Record<string, unknown>;
}

/**
 * Create Nunjucks environment for prompt templates.
 * Per RESEARCH.md: autoescape disabled since prompts are plain text.
 */
export function createPromptEnvironment(): nunjucks.Environment {
	const loader = new nunjucks.FileSystemLoader(TEMPLATES_DIR, {
		watch: false,
		noCache: false,
	});

	const env = new nunjucks.Environment(loader, {
		autoescape: false, // Prompts are plain text, not HTML
		throwOnUndefined: false,
		trimBlocks: true,
		lstripBlocks: true,
	});

	// Add useful filters
	env.addFilter('join', (arr: unknown[], separator = ', ') => {
		if (!Array.isArray(arr)) return '';
		return arr.join(separator);
	});

	env.addFilter('truncate', (str: string, length: number) => {
		if (!str || str.length <= length) return str;
		return `${str.slice(0, length)}...`;
	});

	return env;
}

// Singleton environment instance
let promptEnv: nunjucks.Environment | null = null;

function getPromptEnvironment(): nunjucks.Environment {
	if (!promptEnv) {
		promptEnv = createPromptEnvironment();
	}
	return promptEnv;
}

/**
 * Render a prompt template with CV data.
 * Throws if template not found or context is invalid.
 */
export function renderPrompt(
	promptName: string,
	context: PromptContext,
): string {
	const metadata = getPromptByName(promptName);
	if (!metadata) {
		throw new PromptError(promptName, `Unknown prompt: ${promptName}`);
	}

	// Validate required context
	validatePromptContext(metadata, context);

	const env = getPromptEnvironment();
	try {
		return env.render(metadata.templateFile, context);
	} catch (error) {
		throw new PromptError(
			promptName,
			`Failed to render: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
}

/**
 * Validate that required context is provided.
 */
function validatePromptContext(
	metadata: PromptMetadata,
	context: PromptContext,
): void {
	if (metadata.requiresCV && !context.cv) {
		throw new PromptError(metadata.name, 'CV data is required');
	}

	if (metadata.requiresJobDescription && !context.jobDescription) {
		throw new PromptError(
			metadata.name,
			'Job description is required for tailor prompt',
		);
	}

	if (!context.locale) {
		throw new PromptError(metadata.name, 'Locale is required');
	}
}

/**
 * Get metadata for a prompt.
 */
export function getPromptMetadata(
	promptName: string,
): PromptMetadata | undefined {
	return getPromptByName(promptName);
}

/**
 * Error thrown when prompt rendering fails.
 */
export class PromptError extends Error {
	constructor(
		public readonly promptName: string,
		message: string,
	) {
		super(`Prompt ${promptName}: ${message}`);
		this.name = 'PromptError';
	}
}
