/**
 * AI summarize subcommand.
 * Stage 3: Generate professional summary from CV content.
 * Requires analyze stage to be complete.
 */

import ora from 'ora';
import pc from 'picocolors';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import {
	loadCVForStage,
	loadWorkflowState,
	type SummarizeOutput,
	saveWorkflowState,
} from '../../ai/workflow/index.ts';
import { runSummarizeStage } from '../../ai/workflow/stages/index.ts';

interface SummarizeOptions {
	provider?: string;
	force?: boolean;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Run the summarize stage for a person's CV.
 */
export async function summarizeAction(
	name: string | undefined,
	options: SummarizeOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai summarize <name>');
		process.exit(1);
	}

	const personDir = `./people/${name}`;
	const cwd = process.cwd();

	// Load workflow state
	const state = await loadWorkflowState(personDir);

	if (!state) {
		console.error(pc.red('Error: No workflow state found.'));
		console.error(`Run ${pc.cyan(`cvgen ai analyze ${name}`)} first.`);
		process.exit(1);
	}

	if (!state.stageResults.analyze) {
		console.error(pc.red('Error: Analyze stage must be completed first.'));
		console.error(`Run ${pc.cyan(`cvgen ai analyze ${name}`)} first.`);
		process.exit(1);
	}

	if (state.stageResults.summarize && !options.force) {
		if (!options.quiet) {
			console.log(
				pc.yellow('Summarize stage already complete. Use --force to re-run.'),
			);
		}
		if (options.json) {
			console.log(JSON.stringify(state.stageResults.summarize, null, 2));
		}
		return;
	}

	// Load CV data using shared helper
	const { cv, locale } = await loadCVForStage(personDir);

	// Get AI provider
	const config = await loadAIConfig(cwd);
	const provider = createProvider(
		config,
		options.provider as 'openai' | 'anthropic' | 'ollama' | undefined,
	);

	// Run summarize with spinner
	const spinner = ora('Generating professional summary...').start();

	try {
		const result = await runSummarizeStage({
			cv,
			locale,
			provider,
			analyzeResult: state.stageResults.analyze,
			improveResult: state.stageResults.improve,
		});

		// Update and save state
		const updatedState = {
			...state,
			currentStage: 'summarized' as const,
			completedAt: {
				...state.completedAt,
				summarized: new Date().toISOString(),
			},
			stageResults: { ...state.stageResults, summarize: result },
			lastUpdated: new Date().toISOString(),
		};
		await saveWorkflowState(personDir, updatedState);

		spinner.succeed('Summary generated');

		if (!options.quiet) {
			displaySummarizeResult(result);
		}

		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
		}

		if (!options.quiet && !options.json) {
			console.log(
				`\n${pc.green('Workflow complete!')} (Stage 4 Tailor is optional)`,
			);
			console.log(
				`Optional: ${pc.cyan(`cvgen ai tailor ${name} --job <posting.txt>`)}`,
			);
		}
	} catch (error) {
		spinner.fail('Summary generation failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}

/**
 * Display formatted summarize results to console.
 */
function displaySummarizeResult(result: SummarizeOutput): void {
	console.log(`\n${pc.bold('Professional Summary:')}`);
	console.log(pc.cyan(result.primary));

	if (result.alternative) {
		console.log(`\n${pc.bold('Alternative Summary:')}`);
		console.log(pc.dim(result.alternative));
	}

	if (result.keyPoints.length > 0) {
		console.log(`\n${pc.bold('Key Points:')}`);
		for (const point of result.keyPoints) {
			console.log(`  - ${point}`);
		}
	}

	if (result.targetRoles && result.targetRoles.length > 0) {
		console.log(`\n${pc.bold('Target Roles:')}`);
		console.log(`  ${result.targetRoles.join(', ')}`);
	}
}
