/**
 * AI improve subcommand.
 * Stage 2: Generate improved achievement bullets using STAR method.
 */

import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { AIProvider } from '../../ai/providers/types.ts';
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
}

/**
 * Generate improved achievement bullets using STAR method.
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

		// Update and save state
		const updatedState = updateStageResult(state, 'improve', result);
		await saveWorkflowState(personDir, updatedState);

		spinner?.succeed('Improvements generated');

		if (!options.quiet && !options.json) {
			displayImproveResult(result);
			console.log(`\nNext: ${pc.cyan(`cvgen ai summarize ${name}`)}`);
		}

		if (options.json) {
			outputJson({
				status: 'success',
				stage: 'improve',
				result,
			} as JsonOutput);
		}
	} catch (error) {
		spinner?.fail('Improvement generation failed');
		cons.error(error instanceof Error ? error.message : 'Unknown error');
		process.exit(1);
	}
}

/**
 * Display improvement results in a formatted way.
 */
function displayImproveResult(result: ImproveOutput): void {
	console.log(`\n${pc.bold('Improved Bullets:')}`);

	for (const job of result.jobImprovements) {
		console.log(`\n${pc.bold(pc.blue(job.role))} at ${pc.bold(job.company)}`);

		for (const bullet of job.bullets) {
			console.log(`\n  ${pc.dim('Original:')}`);
			console.log(`    ${pc.dim(bullet.original)}`);
			console.log(`  ${pc.green('Improved:')}`);
			console.log(`    ${pc.green(bullet.improved)}`);
			if (bullet.metrics && bullet.metrics.length > 0) {
				console.log(`  ${pc.cyan('Metrics:')} ${bullet.metrics.join(', ')}`);
			}
			console.log(`  ${pc.dim('Reasoning:')} ${pc.dim(bullet.reasoning)}`);
		}
	}

	if (result.overallNotes) {
		console.log(`\n${pc.bold('Notes:')}`);
		console.log(`  ${result.overallNotes}`);
	}
}
