/**
 * AI tailor subcommand.
 * Stage 4: Adapt CV content for a specific job description (optional).
 * Requires analyze stage and job description file.
 */

import { readFile } from 'node:fs/promises';
import ora from 'ora';
import pc from 'picocolors';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import {
	loadCVForStage,
	loadWorkflowState,
	saveWorkflowState,
	type TailorOutput,
} from '../../ai/workflow/index.ts';
import { runTailorStage } from '../../ai/workflow/stages/index.ts';

interface TailorOptions {
	job?: string;
	provider?: string;
	force?: boolean;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Run the tailor stage for a person's CV.
 * Tailors CV content to match a specific job posting.
 */
export async function tailorAction(
	name: string | undefined,
	options: TailorOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai tailor <name> --job <file>');
		process.exit(1);
	}

	if (!options.job) {
		console.error(pc.red('Error: Job description file is required'));
		console.error('Usage: cvgen ai tailor <name> --job <posting.txt>');
		console.error(
			pc.dim(
				'\nStage 4 (Tailor) is optional. Your workflow is complete after Stage 3 (Summarize).',
			),
		);
		process.exit(1);
	}

	const personDir = `./people/${name}`;
	const cwd = process.cwd();

	// Load job description file
	let jobDescription: string;
	try {
		jobDescription = await readFile(options.job, 'utf-8');
	} catch {
		console.error(
			pc.red(`Error: Could not read job description file: ${options.job}`),
		);
		process.exit(1);
	}

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

	if (state.stageResults.tailor && !options.force) {
		if (!options.quiet) {
			console.log(
				pc.yellow('Tailor stage already complete. Use --force to re-run.'),
			);
		}
		if (options.json) {
			console.log(JSON.stringify(state.stageResults.tailor, null, 2));
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

	// Run tailor with spinner
	const spinner = ora('Tailoring CV for job posting...').start();

	try {
		const result = await runTailorStage({
			cv,
			locale,
			provider,
			jobDescription,
			analyzeResult: state.stageResults.analyze,
			improveResult: state.stageResults.improve,
			summarizeResult: state.stageResults.summarize,
		});

		// Update and save state
		const updatedState = {
			...state,
			currentStage: 'tailored' as const,
			completedAt: {
				...state.completedAt,
				tailored: new Date().toISOString(),
			},
			stageResults: { ...state.stageResults, tailor: result },
			lastUpdated: new Date().toISOString(),
		};
		await saveWorkflowState(personDir, updatedState);

		spinner.succeed('Tailoring complete');

		if (!options.quiet) {
			displayTailorResult(result);
		}

		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
		}

		if (!options.quiet && !options.json) {
			console.log(`\n${pc.green('All stages complete!')}`);
			console.log(`View status: ${pc.cyan(`cvgen ai status ${name}`)}`);
		}
	} catch (error) {
		spinner.fail('Tailoring failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}

/**
 * Display formatted tailor results to console.
 */
function displayTailorResult(result: TailorOutput): void {
	// Match score with color
	const scoreColor =
		result.matchScore >= 75
			? pc.green
			: result.matchScore >= 50
				? pc.yellow
				: pc.red;
	console.log(
		`\n${pc.bold('Match Score:')} ${scoreColor(`${result.matchScore}%`)}`,
	);

	// Keywords analysis
	console.log(`\n${pc.bold('Keywords Analysis:')}`);
	if (result.keywordAnalysis.present.length > 0) {
		console.log(
			`  ${pc.green('Present:')} ${result.keywordAnalysis.present.join(', ')}`,
		);
	}
	if (result.keywordAnalysis.missing.length > 0) {
		console.log(
			`  ${pc.red('Missing:')} ${result.keywordAnalysis.missing.join(', ')}`,
		);
	}

	// Suggestions
	if (result.keywordAnalysis.suggestions.length > 0) {
		console.log(`\n${pc.bold('Suggestions:')}`);
		for (const suggestion of result.keywordAnalysis.suggestions) {
			console.log(`  ${pc.cyan(suggestion.keyword)} in ${suggestion.where}:`);
			console.log(`    ${pc.dim(suggestion.how)}`);
		}
	}

	// Tailored summary
	console.log(`\n${pc.bold('Tailored Summary:')}`);
	console.log(pc.cyan(result.tailoredSummary));

	// Tailored bullets
	if (result.tailoredBullets && result.tailoredBullets.length > 0) {
		console.log(`\n${pc.bold('Tailored Bullets:')}`);
		for (const bullet of result.tailoredBullets) {
			console.log(`\n  ${pc.dim('Section:')} ${bullet.section}`);
			console.log(`  ${pc.red('Original:')} ${bullet.original}`);
			console.log(`  ${pc.green('Tailored:')} ${bullet.tailored}`);
			console.log(`  ${pc.dim('Reason:')} ${bullet.reason}`);
		}
	}
}
