/**
 * AI keywords subcommand - ATS keyword optimization (AI-08).
 */

import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { formatKeywordScore } from '../../ai/display/quality-labels.ts';
import { analyzeKeywords } from '../../ai/generators/keywords.ts';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { ProviderType } from '../../ai/types.ts';
import { loadJobDescription } from '../../ai/utils/index.ts';
import { loadCVForStage } from '../../ai/workflow/index.ts';

export interface KeywordsOptions {
	job?: string;
	exact?: boolean;
	provider?: string;
	quiet?: boolean;
	json?: boolean;
}

export async function keywordsAction(
	name: string | undefined,
	options: KeywordsOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		process.exit(1);
	}

	if (!options.job) {
		console.error(pc.red('Error: Job description is required'));
		console.error('Usage: cvgen ai keywords <name> --job <file>');
		process.exit(1);
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Load CV and job description
	const { cv, locale } = await loadCVForStage(personDir);
	const jobSource = await loadJobDescription(options.job);

	// Get AI provider
	const config = await loadAIConfig(cwd);
	const provider = createProvider(config, options.provider as ProviderType);

	// Analyze with spinner
	const spinner = options.quiet ? null : ora('Analyzing keywords...').start();

	try {
		const result = await analyzeKeywords(
			cv,
			locale,
			provider,
			jobSource.content,
			{
				exact: options.exact,
			},
		);

		spinner?.succeed('Keyword analysis complete');

		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		// Display score prominently
		console.log(
			`\n${pc.bold('Keyword Coverage:')} ${formatKeywordScore(result.score)}`,
		);

		if (result.highCoverage) {
			console.log(
				pc.green(
					'\nExcellent coverage! Your CV matches most job requirements.',
				),
			);
		}

		// Display summary
		console.log(`\n${result.summary}`);

		// Required keywords
		console.log(
			`\n${pc.bold('Required Keywords:')} (${result.byCategory.required.matched}/${result.byCategory.required.total})`,
		);
		for (const kw of result.byCategory.required.keywords) {
			const status = kw.found ? pc.green('Found') : pc.red('Missing');
			console.log(`  ${status} - ${kw.keyword}`);
			if (!kw.found && kw.suggestedPlacement) {
				console.log(
					`    ${pc.dim('Suggestion:')} Add to ${kw.suggestedPlacement}`,
				);
			}
		}

		// Preferred keywords
		console.log(
			`\n${pc.bold('Preferred Keywords:')} (${result.byCategory.preferred.matched}/${result.byCategory.preferred.total})`,
		);
		for (const kw of result.byCategory.preferred.keywords) {
			const status = kw.found ? pc.green('Found') : pc.yellow('Missing');
			console.log(`  ${status} - ${kw.keyword}`);
		}

		// Section suggestions
		if (result.bySection.length > 0) {
			console.log(`\n${pc.bold('Placement Suggestions:')}`);
			for (const section of result.bySection) {
				console.log(`\n  ${pc.cyan(section.section)}:`);
				for (const sug of section.suggestions) {
					console.log(`    Keyword: ${pc.bold(sug.keyword)}`);
					if (sug.currentText) {
						console.log(`    Current: ${pc.dim(sug.currentText)}`);
					}
					console.log(`    Rewrite: ${pc.green(sug.rewrittenText)}`);
				}
			}
		}
	} catch (error) {
		spinner?.fail('Keyword analysis failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}
