/**
 * AI summary subcommand - generate professional summary (AI-07).
 * Standalone generator, not part of workflow state.
 * Note: Distinct from 'summarize' workflow stage command.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { formatSummaryAsCvMd } from '../../ai/display/index.ts';
import { generateSummary } from '../../ai/generators/index.ts';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { AIProvider } from '../../ai/providers/types.ts';
import type { ProviderType } from '../../ai/types.ts';
import { loadCVForStage } from '../../ai/workflow/index.ts';

export interface SummaryOptions {
	targetRole?: string;
	provider?: string;
	output?: string;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Generate professional summary from CV data.
 * This is a standalone command (AI-07) distinct from the workflow summarize stage.
 */
export async function summaryAction(
	name: string | undefined,
	options: SummaryOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai summary <name>');
		process.exit(1);
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Load CV
	let cvData: { cv: import('@gottz/cv-core').CVData; locale: string };
	try {
		cvData = await loadCVForStage(personDir);
	} catch (error) {
		console.error(
			pc.red(error instanceof Error ? error.message : 'Failed to load CV'),
		);
		process.exit(1);
	}
	const { cv, locale } = cvData;

	// Get AI provider
	let provider: AIProvider;
	try {
		const config = await loadAIConfig(cwd);
		provider = createProvider(config, options.provider as ProviderType);
	} catch (error) {
		console.error(
			pc.red(
				error instanceof Error ? error.message : 'Failed to create AI provider',
			),
		);
		console.error('');
		console.error('Configure a provider with:');
		console.error('  export OPENAI_API_KEY=sk-...');
		console.error('  export ANTHROPIC_API_KEY=sk-...');
		process.exit(1);
	}

	// Generate with spinner
	const spinner = options.quiet ? null : ora('Generating summary...').start();

	try {
		const result = await generateSummary(cv, locale, provider, {
			targetRole: options.targetRole,
		});

		spinner?.succeed('Summary generated');

		// JSON output
		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		// Format as cv.md
		const formatted = formatSummaryAsCvMd(result.primary, locale);

		if (options.output) {
			const outputPath = path.resolve(cwd, options.output);
			await writeFile(outputPath, formatted, 'utf-8');
			console.log(pc.green(`Written to ${outputPath}`));
		} else {
			console.log(`\n${formatted}`);
		}

		// Show alternative and key points in non-quiet mode
		if (!options.quiet) {
			if (result.alternative) {
				console.log(`${pc.bold('Alternative:')}`);
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
	} catch (error) {
		spinner?.fail('Summary generation failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}
