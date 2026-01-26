/**
 * Section enhancer with AI integration for wizard flow.
 * Per WIZ-20: AI enhancement via --enhance flag with review flow.
 */

import { confirm } from '@inquirer/prompts';
import { generateText } from 'ai';
import pc from 'picocolors';
import {
	runReviewSession,
	type ReviewItem,
} from '../../ai/review/review-session.js';
import type { AIProvider } from '../../ai/providers/types.js';
import { createProvider, loadAIConfig } from '../../ai/index.js';
import type { WorkExperience } from '@gottz/cv-core';

/**
 * Options for AI enhancement.
 */
export interface EnhanceOptions {
	/** AI provider name (openai, anthropic, ollama) */
	provider?: string;
	/** Job description for tailored enhancement */
	jobDescription?: string;
	/** Non-interactive mode (auto-accept all) */
	nonInteractive: boolean;
	/** JSON output mode */
	jsonOutput: boolean;
}

/**
 * Sections that can be enhanced.
 */
export type EnhanceableSection = 'experience' | 'skills' | 'education' | 'projects';

/**
 * Try to create AI provider, return null if unavailable.
 */
async function tryGetProvider(
	providerName?: string,
): Promise<AIProvider | null> {
	try {
		const config = await loadAIConfig(process.cwd());
		return createProvider(
			config,
			providerName as 'openai' | 'anthropic' | 'ollama' | undefined,
		);
	} catch {
		return null;
	}
}

/**
 * Generate an improved version of a single bullet.
 * Used for initial suggestion and regeneration.
 */
async function generateBulletImprovement(
	provider: AIProvider,
	bullet: string,
	context: {
		role: string;
		company: string;
		jobDescription?: string;
		guidance?: string;
		temperature?: number;
	},
): Promise<string> {
	const systemPrompt = `You are an expert CV writer. Improve achievement bullets using the STAR method.
Focus on: strong action verbs, quantifiable results, specific technologies, clear impact.
Only return the improved bullet text, nothing else.`;

	let userPrompt = `Improve this CV bullet point:

Original: "${bullet}"

Context:
- Role: ${context.role}
- Company: ${context.company}`;

	if (context.jobDescription) {
		userPrompt += `\n- Target job: ${context.jobDescription.slice(0, 500)}`;
	}

	if (context.guidance) {
		userPrompt += `\n\nUser guidance: ${context.guidance}`;
	}

	userPrompt += `

Guidelines:
- Use STAR method (Situation, Task, Action, Result)
- Start with strong action verbs (Led, Developed, Implemented, Reduced, etc.)
- Include quantifiable metrics where reasonable
- Be specific about technologies and methods
- Only use metrics that can be reasonably inferred from the original

Return ONLY the improved bullet text.`;

	const result = await generateText({
		model: provider.model,
		system: systemPrompt,
		prompt: userPrompt,
		temperature: context.temperature ?? 0.7,
	});

	return result.text.trim();
}

/**
 * Enhance experience bullets with AI.
 */
async function enhanceExperienceBullets(
	experience: WorkExperience[],
	options: EnhanceOptions,
): Promise<WorkExperience[]> {
	const provider = await tryGetProvider(options.provider);
	if (!provider) {
		if (!options.nonInteractive) {
			console.log(pc.yellow('AI provider not available. Skipping enhancement.'));
		}
		return experience;
	}

	const enhanced = [...experience];

	for (let i = 0; i < enhanced.length; i++) {
		const exp = enhanced[i];
		if (!exp || exp.bullets.length === 0) continue;

		// Show progress
		if (!options.nonInteractive && !options.jsonOutput) {
			console.log(
				pc.cyan(`\nEnhancing: ${exp.role} at ${exp.company}`),
			);
		}

		// Generate initial improvements for each bullet
		const reviewItems: ReviewItem[] = [];

		for (let bulletIdx = 0; bulletIdx < exp.bullets.length; bulletIdx++) {
			const bullet = exp.bullets[bulletIdx];
			if (!bullet) continue;

			try {
				const suggestion = await generateBulletImprovement(provider, bullet, {
					role: exp.role,
					company: exp.company,
					jobDescription: options.jobDescription,
				});

				// Create a captured context for generateFn
				const capturedProvider = provider;
				const capturedBullet = bullet;
				const capturedRole = exp.role;
				const capturedCompany = exp.company;
				const capturedJobDescription = options.jobDescription;

				reviewItems.push({
					section: `${exp.role} at ${exp.company}`,
					original: bullet,
					suggested: suggestion,
					generateFn: async (guidance: string, temperature: number) => {
						return generateBulletImprovement(capturedProvider, capturedBullet, {
							role: capturedRole,
							company: capturedCompany,
							jobDescription: capturedJobDescription,
							guidance,
							temperature,
						});
					},
				});
			} catch (error) {
				// If individual bullet fails, skip it
				if (!options.nonInteractive && !options.jsonOutput) {
					console.log(
						pc.yellow(`  Warning: Could not enhance bullet ${bulletIdx + 1}`),
					);
				}
			}
		}

		if (reviewItems.length === 0) continue;

		if (options.nonInteractive) {
			// Auto-accept all in non-interactive mode per CONTEXT.md
			const finalBullets = exp.bullets.map((original, idx) => {
				const item = reviewItems.find((r) => r.original === original);
				return item ? item.suggested : original;
			});
			enhanced[i] = { ...exp, bullets: finalBullets };
		} else {
			// Interactive review flow from Phase 17
			const result = await runReviewSession(reviewItems);

			// Build final bullets from review result
			const finalBullets = exp.bullets.map((original) => {
				const item = reviewItems.find((r) => r.original === original);
				if (!item) return original;

				if (result.accepted.includes(item)) {
					return item.suggested;
				}
				const edited = result.edited.get(item);
				if (edited) {
					return edited;
				}
				return original;
			});

			enhanced[i] = { ...exp, bullets: finalBullets };
		}
	}

	return enhanced;
}

/**
 * Enhance a wizard section with AI.
 *
 * @param section - Section type to enhance
 * @param data - Current section data
 * @param options - Enhancement options
 * @returns Enhanced section data (or original if AI unavailable)
 */
export async function enhanceSection<T>(
	section: EnhanceableSection,
	data: T,
	options: EnhanceOptions,
): Promise<T> {
	try {
		switch (section) {
			case 'experience':
				return (await enhanceExperienceBullets(
					data as unknown as WorkExperience[],
					options,
				)) as unknown as T;

			case 'skills':
			case 'education':
			case 'projects':
				// These sections have simpler enhancement - just improve descriptions
				// For now, return as-is. Can be expanded in future iterations.
				return data;

			default:
				return data;
		}
	} catch (error) {
		// Per CONTEXT.md: prompt to continue if AI unavailable
		if (!options.nonInteractive) {
			const continueWithout = await confirm({
				message: `AI unavailable: ${(error as Error).message}. Continue without enhancement?`,
				default: true,
			});
			if (continueWithout) {
				return data;
			}
			throw error;
		}

		// Non-interactive: log warning and continue
		process.stderr.write(
			pc.yellow(
				`Warning: AI unavailable (${(error as Error).message}), proceeding without enhancement\n`,
			),
		);
		return data;
	}
}
