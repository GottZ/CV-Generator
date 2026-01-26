/**
 * AI analyze subcommand.
 * Stage 1: Analyze CV structure and identify improvement opportunities.
 */

import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { AIProvider } from '../../ai/providers/types.ts';
import type { ProviderType } from '../../ai/types.ts';
import {
	type AnalyzeOutput,
	type CVLoadResult,
	checkStagePrerequisites,
	createInitialState,
	isStageComplete,
	loadCVForStage,
	loadWorkflowState,
	runAnalyzeStage,
	saveWorkflowState,
	updateStageResult,
} from '../../ai/workflow/index.ts';
import {
	createConsole,
	type JsonOutput,
	outputJson,
} from '../../lib/console.ts';

export interface AnalyzeOptions {
	provider?: string;
	force?: boolean;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Analyze CV structure and identify improvements.
 */
export async function analyzeAction(
	name: string | undefined,
	options: AnalyzeOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });

	if (!name) {
		cons.error('Error: Person name is required');
		cons.info('Usage: cvgen ai analyze <name>');
		process.exit(1);
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Check if already complete
	let state = await loadWorkflowState(personDir);

	if (isStageComplete(state, 'analyze') && !options.force) {
		if (!options.quiet) {
			cons.info(
				pc.yellow('Analyze stage already complete. Use --force to re-run.'),
			);
			cons.info(`Status: ${pc.green('analyzed')}`);
		}
		if (options.json && state?.stageResults.analyze) {
			outputJson({
				status: 'success',
				stage: 'analyze',
				alreadyComplete: true,
				result: state.stageResults.analyze,
			} as JsonOutput);
		}
		return;
	}

	// Check prerequisites
	const prereqs = checkStagePrerequisites(state, 'analyze');
	if (!prereqs.canRun) {
		cons.error(prereqs.reason ?? 'Cannot run analyze stage');
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

	// Create initial state if needed
	if (!state) {
		state = createInitialState(cvData.cvPath, cvData.locale);
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

	// Run analysis with spinner
	const spinner = options.quiet ? null : ora('Analyzing CV...').start();

	try {
		const result = await runAnalyzeStage({
			cv: cvData.cv,
			locale: cvData.locale,
			provider,
		});

		// Update and save state
		state = updateStageResult(state, 'analyze', result);
		await saveWorkflowState(personDir, state);

		spinner?.succeed('Analysis complete');

		if (!options.quiet && !options.json) {
			displayAnalyzeResult(result);
			console.log(`\nNext: ${pc.cyan(`cvgen ai improve ${name}`)}`);
		}

		if (options.json) {
			outputJson({
				status: 'success',
				stage: 'analyze',
				result,
			} as JsonOutput);
		}
	} catch (error) {
		spinner?.fail('Analysis failed');
		cons.error(error instanceof Error ? error.message : 'Unknown error');
		process.exit(1);
	}
}

/**
 * Display analysis results in a formatted way.
 */
function displayAnalyzeResult(result: AnalyzeOutput): void {
	console.log(`\n${pc.bold('Sections:')}`);
	for (const section of result.sections) {
		const statusColor =
			section.status === 'strong'
				? pc.green
				: section.status === 'needs_improvement'
					? pc.yellow
					: pc.red;
		console.log(
			`  ${section.name}: ${statusColor(section.status)} (${section.bulletCount} bullets)`,
		);
		if (section.issues.length > 0) {
			for (const issue of section.issues) {
				console.log(`    - ${pc.dim(issue)}`);
			}
		}
	}

	if (result.gaps.length > 0) {
		console.log(`\n${pc.bold('Gaps:')}`);
		for (const gap of result.gaps) {
			console.log(`  - ${gap}`);
		}
	}

	if (result.priorities.length > 0) {
		console.log(`\n${pc.bold('Priorities:')}`);
		for (const priority of result.priorities) {
			const impactColor =
				priority.impact === 'high'
					? pc.red
					: priority.impact === 'medium'
						? pc.yellow
						: pc.dim;
			console.log(
				`  [${impactColor(priority.impact.toUpperCase())}] ${priority.section}: ${priority.issue}`,
			);
		}
	}
}
