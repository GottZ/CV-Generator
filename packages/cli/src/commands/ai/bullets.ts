/**
 * AI bullets subcommand - generate achievement bullets (AI-06).
 * Standalone generator, not part of workflow state.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { formatBulletsAsCvMd } from '../../ai/display/index.ts';
import { formatQualityLabel } from '../../ai/display/quality-labels.ts';
import { generateBullets } from '../../ai/generators/index.ts';
import { createProvider, loadAIConfig } from '../../ai/index.ts';
import type { ProviderType } from '../../ai/types.ts';
import { loadJobDescription } from '../../ai/utils/index.ts';
import { loadCVForStage } from '../../ai/workflow/index.ts';

export interface BulletsOptions {
	showStar?: boolean;
	tailored?: boolean;
	job?: string;
	provider?: string;
	output?: string;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Generate STAR-formatted achievement bullets for CV work experience.
 */
export async function bulletsAction(
	name: string | undefined,
	options: BulletsOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai bullets <name>');
		process.exit(1);
	}

	// Validate tailored requires job
	if (options.tailored && !options.job) {
		console.error(
			pc.red('Error: --tailored requires --job <file> to be specified'),
		);
		process.exit(1);
	}

	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Load CV data
	let cvData: { cv: import('@gottz/cv-core').CVData; locale: string };
	try {
		cvData = await loadCVForStage(personDir);
	} catch (error) {
		console.error(
			pc.red(error instanceof Error ? error.message : 'Failed to load CV'),
		);
		process.exit(1);
	}

	// Load job description if provided
	let jobDescription: string | undefined;
	if (options.job) {
		try {
			const jobSource = await loadJobDescription(options.job);
			jobDescription = jobSource.content;
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
	}

	// Get AI provider
	let provider: import('../../ai/providers/types.ts').AIProvider;
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

	// Generate bullets with spinner
	const spinner = options.quiet
		? null
		: ora('Generating achievement bullets...').start();

	try {
		const result = await generateBullets(cvData.cv, cvData.locale, provider, {
			showStar: options.showStar,
			tailored: options.tailored,
			jobDescription,
		});

		spinner?.succeed('Bullets generated');

		// Output as JSON if requested
		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		// Format as cv.md
		const formattedRoles = result.roles.map((role) => ({
			company: role.company,
			role: role.role,
			startDate: role.startDate,
			endDate: role.endDate,
			bullets: role.bullets.map((b) => ({
				text: b.text,
				starBreakdown: b.starBreakdown,
				quality: b.quality,
			})),
		}));

		const cvMd = formatBulletsAsCvMd(formattedRoles, cvData.locale, {
			showStar: options.showStar,
		});

		// Write to file or stdout
		if (options.output) {
			const outputPath = path.resolve(cwd, options.output);
			await writeFile(outputPath, cvMd, 'utf-8');
			if (!options.quiet) {
				console.log(`\nWritten to: ${pc.cyan(outputPath)}`);
			}
		} else {
			console.log(`\n${cvMd}`);
		}

		// Show quality summary
		if (!options.quiet) {
			console.log(
				`\n${pc.bold('Overall Quality:')} ${formatQualityLabel(result.overallQuality)}`,
			);

			// Show per-role quality breakdown
			for (const role of result.roles) {
				const strongCount = role.bullets.filter(
					(b) => b.quality === 'strong',
				).length;
				const goodCount = role.bullets.filter(
					(b) => b.quality === 'good',
				).length;
				const reviewCount = role.bullets.filter(
					(b) => b.quality === 'needs_review',
				).length;

				console.log(
					`\n${pc.dim(role.role)} at ${pc.dim(role.company)}: ` +
						`${role.bullets.length} bullets ` +
						`(${pc.green(String(strongCount))} strong, ${pc.yellow(String(goodCount))} good, ${pc.red(String(reviewCount))} review)`,
				);
				console.log(pc.dim(`  Reasoning: ${role.bulletCountReasoning}`));
			}
		}
	} catch (error) {
		spinner?.fail('Bullet generation failed');
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}
