/**
 * AI improve subcommand.
 * Stage 2: Generate improved achievement bullets using STAR method.
 * Enhanced with interactive review for user control over changes.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { displayComparison } from '../../ai/display/diff-display.ts';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { AIProvider } from '../../ai/providers/types.ts';
import {
	applyReviewedChanges,
	ensureInteractiveMode,
	type ReviewItem,
	type ReviewState,
	runReviewSession,
	safeWriteCvFile,
} from '../../ai/review/index.ts';
import type { ProviderType } from '../../ai/types.ts';
import {
	type CVLoadResult,
	checkStagePrerequisites,
	type ImproveOutput,
	isStageComplete,
	loadCVForStage,
	loadWorkflowState,
	runImproveStage,
	saveWorkflowState,
	updateStageResult,
} from '../../ai/workflow/index.ts';
import {
	createConsole,
	type JsonOutput,
	outputJson,
} from '../../lib/console.ts';

export interface ImproveOptions {
	provider?: string;
	force?: boolean;
	quiet?: boolean;
	json?: boolean;
	dryRun?: boolean;
	acceptAll?: boolean;
}

/**
 * Generate improved achievement bullets using STAR method.
 * Runs interactive review by default for user control over changes.
 */
export async function improveAction(
	name: string | undefined,
	options: ImproveOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });

	if (!name) {
		cons.error('Error: Person name is required');
		cons.info('Usage: cvgen ai improve <name>');
		process.exit(1);
	}

	// TTY check for interactive mode
	// Skip if using JSON output, acceptAll, or dryRun (non-interactive modes)
	if (!options.json && !options.acceptAll && !options.dryRun) {
		ensureInteractiveMode();
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Load existing workflow state
	const state = await loadWorkflowState(personDir);

	// Check if already complete
	if (isStageComplete(state, 'improve') && !options.force) {
		if (!options.quiet) {
			cons.info(
				pc.yellow('Improve stage already complete. Use --force to re-run.'),
			);
			cons.info(`Status: ${pc.green('improved')}`);
		}
		if (options.json && state?.stageResults.improve) {
			outputJson({
				status: 'success',
				stage: 'improve',
				alreadyComplete: true,
				result: state.stageResults.improve,
			} as JsonOutput);
		}
		return;
	}

	// Check prerequisites (needs analyze to be complete)
	const prereqs = checkStagePrerequisites(state, 'improve');
	if (!prereqs.canRun) {
		cons.error(prereqs.reason ?? 'Cannot run improve stage');
		process.exit(1);
	}

	// At this point we know state exists and has analyze results
	if (!state || !state.stageResults.analyze) {
		cons.error(`Analyze stage not complete. Run: cvgen ai analyze ${name}`);
		process.exit(1);
	}

	// Load CV data
	let cvData: CVLoadResult;
	try {
		cvData = await loadCVForStage(personDir);
	} catch (error) {
		cons.error(error instanceof Error ? error.message : 'Failed to load CV');
		process.exit(1);
	}

	// Get AI provider
	let provider: AIProvider;
	try {
		const config = await loadAIConfig(cwd);
		provider = createProvider(config, options.provider as ProviderType);
	} catch (error) {
		cons.error(
			error instanceof Error ? error.message : 'Failed to create AI provider',
		);
		cons.info('');
		cons.info('Configure a provider with:');
		cons.info('  export OPENAI_API_KEY=sk-...');
		cons.info('  export ANTHROPIC_API_KEY=sk-...');
		process.exit(1);
	}

	// Run improvement with spinner
	const spinner = options.quiet
		? null
		: ora('Generating improvements...').start();

	try {
		const result = await runImproveStage({
			cv: cvData.cv,
			locale: cvData.locale,
			provider,
			analyzeResult: state.stageResults.analyze,
		});

		spinner?.succeed('Improvements generated');

		// Handle JSON output mode (non-interactive)
		if (options.json) {
			// Update and save state
			const updatedState = updateStageResult(state, 'improve', result);
			await saveWorkflowState(personDir, updatedState);

			outputJson({
				status: 'success',
				stage: 'improve',
				result,
			} as JsonOutput);
			return;
		}

		// Convert result to ReviewItem[] for interactive review
		const reviewItems = createReviewItems(result, provider, cvData);

		// Handle dry-run mode (show all diffs without prompts)
		if (options.dryRun) {
			displayDryRun(result);
			return;
		}

		// Handle accept-all mode (auto-accept with write confirmation)
		if (options.acceptAll) {
			const reviewState = createAcceptAllState(reviewItems);
			await applyAndWriteChanges(
				personDir,
				cvData,
				reviewState,
				state,
				result,
				cons,
				name,
			);
			return;
		}

		// Interactive review mode (default)
		const reviewState = await runReviewSession(reviewItems);

		// Check if any changes were accepted
		if (reviewState.accepted.length === 0 && reviewState.edited.size === 0) {
			console.log(pc.yellow('\nNo changes accepted.'));
			return;
		}

		// Apply and write changes
		await applyAndWriteChanges(
			personDir,
			cvData,
			reviewState,
			state,
			result,
			cons,
			name,
		);
	} catch (error) {
		spinner?.fail('Improvement generation failed');
		cons.error(error instanceof Error ? error.message : 'Unknown error');
		process.exit(1);
	}
}

/**
 * Convert ImproveOutput to ReviewItem[] for interactive review.
 * Each bullet becomes a ReviewItem with regeneration capability.
 */
function createReviewItems(
	result: ImproveOutput,
	provider: AIProvider,
	cvData: CVLoadResult,
): ReviewItem[] {
	const items: ReviewItem[] = [];

	for (const job of result.jobImprovements) {
		for (const bullet of job.bullets) {
			items.push({
				section: `${job.role} at ${job.company}`,
				original: bullet.original,
				suggested: bullet.improved,
				// Generate function for regeneration
				generateFn: async (guidance: string, temperature: number) => {
					// Re-run improve stage with temperature override
					// In a real implementation, we'd want single-bullet regeneration
					// For now, we use the standalone generator approach
					const { generateText, Output } = await import('ai');
					const { renderRawPrompt } = await import('../../ai/prompts/index.ts');
					const { z } = await import('zod');

					const SingleBulletSchema = z.object({
						improved: z.string().describe('The improved bullet text'),
					});

					const prompt = renderRawPrompt('regenerate-bullet', {
						original: bullet.original,
						current_suggestion: bullet.improved,
						guidance: guidance || 'Generate an alternative improvement',
						locale: cvData.locale,
					});

					const { output } = await generateText({
						model: provider.model,
						temperature,
						system:
							'You are an expert CV writer. Improve the achievement bullet using the STAR method. Focus on quantifiable metrics and strong action verbs.',
						prompt,
						output: Output.object({ schema: SingleBulletSchema }),
					});

					if (!output) {
						throw new Error('Regeneration failed: No output from LLM');
					}

					return output.improved;
				},
			});
		}
	}

	return items;
}

/**
 * Create a ReviewState with all items accepted.
 * Used for --accept-all mode.
 */
function createAcceptAllState(items: ReviewItem[]): ReviewState {
	return {
		accepted: [...items],
		skipped: [],
		edited: new Map(),
	};
}

/**
 * Display all suggestions in dry-run mode.
 * Shows diffs without interactive prompts.
 */
function displayDryRun(result: ImproveOutput): void {
	console.log(`\n${pc.bold('Dry Run - Suggested Improvements:')}`);

	for (const job of result.jobImprovements) {
		console.log(`\n${pc.bold(pc.blue(job.role))} at ${pc.bold(job.company)}`);

		for (const bullet of job.bullets) {
			console.log('');
			const diff = displayComparison(bullet.original, bullet.improved);
			console.log(diff);

			if (bullet.metrics && bullet.metrics.length > 0) {
				console.log(`${pc.cyan('Metrics:')} ${bullet.metrics.join(', ')}`);
			}
			console.log(`${pc.dim('Reasoning:')} ${pc.dim(bullet.reasoning)}`);
		}
	}

	console.log(pc.dim('\n(Dry run - no changes written)'));
}

/**
 * Apply reviewed changes and write to CV file.
 */
async function applyAndWriteChanges(
	personDir: string,
	_cvData: CVLoadResult,
	reviewState: ReviewState,
	workflowState: NonNullable<Awaited<ReturnType<typeof loadWorkflowState>>>,
	result: ImproveOutput,
	cons: ReturnType<typeof createConsole>,
	name: string,
): Promise<void> {
	// Read original CV content
	const cvPath = path.join(personDir, 'cv.md');
	const originalContent = readFileSync(cvPath, 'utf-8');

	// Apply reviewed changes
	const newContent = applyReviewedChanges(originalContent, reviewState);

	// Prepare change summary
	const changes = {
		accepted: reviewState.accepted.length,
		skipped: reviewState.skipped.length,
		edited: reviewState.edited.size,
	};

	// Safe write with backup and confirmation
	const writeResult = await safeWriteCvFile(cvPath, newContent, changes);

	if (!writeResult.success) {
		if (writeResult.error) {
			cons.error(`Write failed: ${writeResult.error}`);
		}
		return;
	}

	// Update and save workflow state only after successful write
	const updatedState = updateStageResult(workflowState, 'improve', result);
	await saveWorkflowState(personDir, updatedState);

	console.log(`\nNext: ${pc.cyan(`cvgen ai summarize ${name}`)}`);
}
