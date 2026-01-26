/**
 * AI tailor subcommand (AI-10).
 * Adapt CV content for a specific job description.
 * Enhanced with multi-source job input (file, URL, stdin) and cv.md output.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { formatSummaryAsCvMd } from '../../ai/display/cv-format.ts';
import { formatMatchScore } from '../../ai/display/quality-labels.ts';
import { tailorCV } from '../../ai/generators/index.ts';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import {
	type JobDescriptionSource,
	loadJobDescription,
} from '../../ai/utils/index.ts';
import { type CVLoadResult, loadCVForStage } from '../../ai/workflow/index.ts';

export interface TailorOptions {
	job?: string;
	provider?: string;
	output?: string;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Run standalone tailor for a person's CV.
 * Enhanced: Loads jobs from file, URL, or stdin. Caches to jobs/ directory.
 */
export async function tailorAction(
	name: string | undefined,
	options: TailorOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai tailor <name> --job <file|url>');
		process.exit(1);
	}

	if (!options.job) {
		console.error(pc.red('Error: Job description is required'));
		console.error('Usage: cvgen ai tailor <name> --job <posting.txt>');
		console.error(
			'       cvgen ai tailor <name> --job https://jobs.example.com/12345',
		);
		console.error('       cat posting.txt | cvgen ai tailor <name> --job -');
		process.exit(1);
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Load CV
	let cvData: CVLoadResult;
	try {
		cvData = await loadCVForStage(personDir);
	} catch (error) {
		console.error(
			pc.red(error instanceof Error ? error.message : 'Failed to load CV data'),
		);
		process.exit(1);
	}
	const { cv, locale } = cvData;

	// Load job description from file, URL, or stdin
	let jobSource: JobDescriptionSource;
	try {
		jobSource = await loadJobDescription(options.job);
	} catch (error) {
		console.error(
			pc.red(
				error instanceof Error
					? error.message
					: 'Failed to load job description',
			),
		);
		process.exit(1);
	}

	// Cache job description
	const jobsDir = path.join(personDir, 'jobs');
	await mkdir(jobsDir, { recursive: true });
	const jobFileName = `${new Date().toISOString().split('T')[0]}-job.md`;
	const jobFilePath = path.join(jobsDir, jobFileName);
	await writeFile(jobFilePath, jobSource.content, 'utf-8');

	// Get AI provider
	const config = await loadAIConfig(cwd);
	const provider = createProvider(
		config,
		options.provider as 'openai' | 'anthropic' | 'ollama' | undefined,
	);

	// Tailor with spinner
	const spinner = options.quiet ? null : ora('Tailoring CV...').start();

	try {
		const result = await tailorCV(cv, locale, provider, jobSource.content);

		spinner?.succeed('Tailoring complete');

		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		// Display match score with color
		console.log(
			`\n${pc.bold('Match Score:')} ${formatMatchScore(result.matchScore)}`,
		);

		// Keywords analysis
		console.log(`\n${pc.bold('Keywords:')}`);
		console.log(
			`  ${pc.green('Present:')} ${result.keywordAnalysis.present.join(', ') || 'None'}`,
		);
		console.log(
			`  ${pc.red('Missing:')} ${result.keywordAnalysis.missing.join(', ') || 'None'}`,
		);

		// Tailored summary
		console.log(`\n${pc.bold('Tailored Summary:')}`);
		console.log(pc.cyan(result.tailoredSummary));

		// Tailored bullets
		if (result.tailoredBullets && result.tailoredBullets.length > 0) {
			console.log(`\n${pc.bold('Tailored Bullets:')}`);
			for (const bullet of result.tailoredBullets) {
				console.log(`\n  ${pc.dim(`[${bullet.section}]`)}`);
				console.log(`  ${pc.red('Original:')} ${bullet.original}`);
				console.log(`  ${pc.green('Tailored:')} ${bullet.tailored}`);
				console.log(`  ${pc.dim('Reason:')} ${bullet.reason}`);
			}
		}

		// Write cv.md output if requested
		if (options.output) {
			const formatted = formatSummaryAsCvMd(result.tailoredSummary, locale);
			await writeFile(options.output, formatted, 'utf-8');
			console.log(`\n${pc.green(`Summary written to ${options.output}`)}`);
		}

		// Suggestions
		if (result.keywordAnalysis.suggestions.length > 0) {
			console.log(`\n${pc.bold('Keyword Placement Suggestions:')}`);
			for (const sug of result.keywordAnalysis.suggestions) {
				console.log(
					`  ${pc.cyan(sug.keyword)} -> ${sug.where}: ${pc.dim(sug.how)}`,
				);
			}
		}

		console.log(
			`\n${pc.dim(`Job description cached to: ${path.join('jobs', jobFileName)}`)}`,
		);
	} catch (error) {
		spinner?.fail('Tailoring failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}
