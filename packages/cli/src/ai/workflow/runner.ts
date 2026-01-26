/**
 * Stage runner infrastructure for multi-stage CV workflow.
 * Provides core execution, CV loading, and result orchestration.
 * Uses AI SDK 6 with structured output via Output.object().
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import { parseCV } from '@gottz/cv-core';
import type { WorkflowState } from './types.ts';

/**
 * Options for running a workflow stage.
 */
export interface StageRunnerOptions {
	/** Path to person directory (e.g., ./people/jane) */
	personDir: string;
	/** Locale for CV content and prompts */
	locale: string;
	/** Override default provider (openai, anthropic, ollama) */
	provider?: string;
	/** Re-run even if stage is complete */
	force?: boolean;
	/** Job description for tailor stage */
	jobDescription?: string;
}

/**
 * Result from running a stage.
 */
export interface StageResult<T> {
	/** Whether the stage completed successfully */
	success: boolean;
	/** Structured output from the LLM */
	output?: T;
	/** Error message if stage failed */
	error?: string;
}

/**
 * Result from loading CV data.
 */
export interface CVLoadResult {
	/** Parsed CV data */
	cv: CVData;
	/** Locale determined from CV */
	locale: string;
	/** Path to CV file */
	cvPath: string;
}

/**
 * Load CV data from a person's directory.
 * Finds cv.md, parses it, and determines locale.
 *
 * @param personDir - Path to person directory (e.g., ./people/jane)
 * @returns Parsed CV data with locale and path
 * @throws Error if person directory or cv.md not found
 */
export async function loadCVForStage(personDir: string): Promise<CVLoadResult> {
	const cvPath = path.join(personDir, 'cv.md');

	// Check person directory exists
	try {
		await readdir(personDir);
	} catch {
		throw new Error(`Person directory not found: ${personDir}`);
	}

	// Read and parse CV
	let cvContent: string;
	try {
		cvContent = await readFile(cvPath, 'utf-8');
	} catch {
		throw new Error(`CV file not found: ${cvPath}`);
	}

	const result = parseCV(cvContent);

	if (result.errors.length > 0) {
		const errorMessages = result.errors.map((e) => e.message).join(', ');
		throw new Error(`CV parse error: ${errorMessages}`);
	}

	const cv = result.data as CVData;
	const locale = determineLocale(cv);

	return { cv, locale, cvPath };
}

/**
 * Determine the primary locale from CV data.
 * Prefers experience locale, falls back to summary, then 'en'.
 */
function determineLocale(cv: CVData): string {
	// Check experience first (most common section)
	if (cv.experience) {
		const locales = Object.keys(cv.experience);
		const first = locales[0];
		if (first) return first;
	}

	// Fall back to summary
	if (cv.summary) {
		const locales = Object.keys(cv.summary);
		const first = locales[0];
		if (first) return first;
	}

	// Default to English
	return 'en';
}

/**
 * Get results from previous stages needed as context.
 * Used to provide prior analysis/improvements to subsequent stages.
 *
 * @param state - Current workflow state
 * @param stageName - Target stage needing context
 * @returns Previous results object for prompt context
 */
export function getPreviousResults(
	state: WorkflowState,
	stageName: 'analyze' | 'improve' | 'summarize' | 'tailor',
): Record<string, unknown> {
	const results: Record<string, unknown> = {};

	switch (stageName) {
		case 'analyze':
			// Analyze is the first stage, no previous results needed
			break;

		case 'improve':
			// Improve uses analyze results
			if (state.stageResults.analyze) {
				results.analyzeResult = state.stageResults.analyze;
			}
			break;

		case 'summarize':
			// Summarize uses analyze + improve results
			if (state.stageResults.analyze) {
				results.analyzeResult = state.stageResults.analyze;
			}
			if (state.stageResults.improve) {
				results.improveResult = state.stageResults.improve;
			}
			break;

		case 'tailor':
			// Tailor uses all previous results
			if (state.stageResults.analyze) {
				results.analyzeResult = state.stageResults.analyze;
			}
			if (state.stageResults.improve) {
				results.improveResult = state.stageResults.improve;
			}
			if (state.stageResults.summarize) {
				results.summarizeResult = state.stageResults.summarize;
			}
			break;
	}

	return results;
}

/**
 * Check if a stage can be run based on prerequisites.
 * Stages must be run in order: analyze -> improve -> summarize -> tailor.
 *
 * @param state - Current workflow state (or null for new workflow)
 * @param stageName - Stage to check
 * @returns Object indicating if stage can run and why not
 */
export function checkStagePrerequisites(
	state: WorkflowState | null,
	stageName: 'analyze' | 'improve' | 'summarize' | 'tailor',
): { canRun: boolean; reason?: string } {
	// Analyze has no prerequisites
	if (stageName === 'analyze') {
		return { canRun: true };
	}

	// All other stages require analyze to be complete
	if (!state || !state.stageResults.analyze) {
		return {
			canRun: false,
			reason: `Stage '${stageName}' requires 'analyze' stage to be complete first. Run: cvgen ai analyze <name>`,
		};
	}

	// Summarize and tailor require improve
	if (stageName === 'summarize' || stageName === 'tailor') {
		if (!state.stageResults.improve) {
			return {
				canRun: false,
				reason: `Stage '${stageName}' requires 'improve' stage to be complete first. Run: cvgen ai improve <name>`,
			};
		}
	}

	// Tailor requires summarize
	if (stageName === 'tailor') {
		if (!state.stageResults.summarize) {
			return {
				canRun: false,
				reason: `Stage '${stageName}' requires 'summarize' stage to be complete first. Run: cvgen ai summarize <name>`,
			};
		}
	}

	return { canRun: true };
}

/**
 * Check if a stage is already complete.
 *
 * @param state - Current workflow state
 * @param stageName - Stage to check
 * @returns true if stage has completed results
 */
export function isStageComplete(
	state: WorkflowState | null,
	stageName: 'analyze' | 'improve' | 'summarize' | 'tailor',
): boolean {
	if (!state) return false;
	return state.stageResults[stageName] !== undefined;
}
