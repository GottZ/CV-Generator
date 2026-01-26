/**
 * Wizard orchestration module.
 * Coordinates the wizard flow with menu navigation and Ctrl+C handling.
 * Implements WIZ-01 through WIZ-06, WIZ-09, and WIZ-20.
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCV } from '@gottz/cv-core';
import pc from 'picocolors';

import { ensureInteractiveMode } from '../ai/review/tty-check.ts';
import {
	type EnhanceOptions,
	enhanceSection,
} from './enhance/section-enhancer.ts';
import { writeWizardOutput } from './markdown-writer.ts';
import { selectLocale, selectMode, showMainMenu } from './menu.ts';
import {
	collectCertifications,
	collectContact,
	collectEducation,
	collectExperience,
	collectProjects,
	collectSkills,
} from './prompts/index.ts';
import {
	createInitialState,
	createStateFromExisting,
	isMinimumViable,
} from './state.ts';
import { confirmSave, displaySummary } from './summary.ts';
import type { WizardState } from './types.ts';

/**
 * Options for running the wizard.
 */
export interface WizardOptions {
	/** Full path to person directory */
	personDir: string;
	/** Directory name (e.g., "jane-doe") */
	personName: string;
	/** Locale for localized sections (default: 'en') */
	locale?: string;
	/** Enable AI enhancement for content (WIZ-20) */
	enhance?: boolean;
	/** AI provider name (openai, anthropic, ollama) */
	provider?: string;
	/** Job description file path for tailored enhancement */
	job?: string;
}

/**
 * Set up clean exit handler for Ctrl+C.
 * Per RESEARCH.md: Handle ExitPromptError for clean Ctrl+C exit.
 */
function setupCleanExit(): void {
	process.on('uncaughtException', (error) => {
		if (error instanceof Error && error.name === 'ExitPromptError') {
			console.log(pc.dim('\nWizard cancelled. No changes saved.'));
			process.exit(130); // Standard SIGINT exit code
		}
		throw error;
	});
}

/**
 * Try to load an existing CV from the person directory.
 * @param personDir - Full path to person directory
 * @param locale - Locale for localized sections
 * @returns Existing CV content or null if not found
 */
async function loadExistingCV(
	personDir: string,
	locale: string,
): Promise<WizardState | null> {
	const cvPath = path.join(personDir, 'cv.md');

	try {
		await access(cvPath);
		const content = await readFile(cvPath, 'utf-8');
		const result = parseCV(content);

		if (result.data) {
			const mode = await selectMode();
			return createStateFromExisting(result.data, mode, locale);
		}

		return null;
	} catch {
		// File doesn't exist or parse failed
		return null;
	}
}

/**
 * Read job description file if provided.
 */
async function loadJobDescription(
	jobPath: string | undefined,
): Promise<string | undefined> {
	if (!jobPath) return undefined;

	try {
		return await readFile(jobPath, 'utf-8');
	} catch {
		console.log(
			pc.yellow(`Warning: Could not read job description from ${jobPath}`),
		);
		return undefined;
	}
}

/**
 * Run the main wizard loop with optional enhancement.
 * @param state - Current wizard state
 * @param options - Wizard options including enhancement settings
 * @returns Final wizard state after all edits
 */
async function runWizardLoop(
	state: WizardState,
	options: WizardOptions,
): Promise<WizardState> {
	// Load job description once for all enhancement calls
	const jobDescription = options.enhance
		? await loadJobDescription(options.job)
		: undefined;

	// Build enhancement options
	const enhanceOpts: EnhanceOptions | undefined = options.enhance
		? {
				provider: options.provider,
				jobDescription,
				nonInteractive: false, // Interactive mode allows user review
				jsonOutput: false,
			}
		: undefined;

	while (true) {
		const selection = await showMainMenu(state);

		switch (selection) {
			case 'contact':
				state.contact = await collectContact(state.mode, state.contact);
				break;

			case 'experience':
				state.experience = await collectExperience(
					state.mode,
					state.experience,
				);
				// Apply enhancement after collecting experience (WIZ-20)
				if (enhanceOpts && state.experience.length > 0) {
					console.log(pc.cyan('\nEnhancing experience bullets with AI...'));
					state.experience = await enhanceSection(
						'experience',
						state.experience,
						enhanceOpts,
					);
				}
				break;

			case 'education':
				state.education = await collectEducation(state.mode, state.education);
				break;

			case 'skills':
				state.skills = await collectSkills(state.mode, state.skills);
				break;

			case 'projects':
				state.projects = await collectProjects(state.mode, state.projects);
				break;

			case 'certifications':
				state.certifications = await collectCertifications(
					state.mode,
					state.certifications,
				);
				break;

			case 'finish':
				return state;

			case 'cancel':
				console.log(pc.dim('\nWizard cancelled. No changes saved.'));
				process.exit(0);
		}

		state.currentSection = selection;
	}
}

/**
 * Run the full wizard flow.
 * Creates a new CV or edits an existing one through guided prompts.
 *
 * @param options - Wizard options including person directory and locale
 */
export async function runWizard(options: WizardOptions): Promise<void> {
	const { personDir, personName } = options;

	// Ensure we're in an interactive terminal (WIZ-18 prep for Phase 19)
	ensureInteractiveMode();

	// Set up clean exit handler
	setupCleanExit();

	let state: WizardState;
	let locale: string;

	// Try to load existing CV
	const existingLocale = options.locale ?? 'en';
	const existingState = await loadExistingCV(personDir, existingLocale);

	if (existingState) {
		console.log(pc.cyan(`Editing existing CV for ${personName}`));
		state = existingState;
		// For existing CVs, use existing locale or prompt
		locale = existingLocale;
	} else {
		console.log(pc.cyan(`Creating new CV for ${personName}`));
		const mode = await selectMode();
		locale = await selectLocale();
		state = createInitialState(mode);
	}

	// Show enhancement status if enabled
	if (options.enhance) {
		console.log(
			pc.cyan('AI enhancement enabled. Content will be enhanced after entry.'),
		);
	}

	// Main wizard loop
	state = await runWizardLoop(state, options);

	// Check minimum viable CV
	if (!isMinimumViable(state)) {
		console.log(pc.yellow('\nYour CV needs at least contact info and one of:'));
		console.log(pc.yellow('  - Work experience'));
		console.log(pc.yellow('  - Education'));
		console.log(pc.yellow('  - Skills'));
		console.log(pc.yellow('\nReturning to menu...'));
		state = await runWizardLoop(state, options);
	}

	// Confirm and save
	let action = await confirmSave(state);

	while (action === 'edit') {
		state = await runWizardLoop(state, options);

		if (!isMinimumViable(state)) {
			console.log(
				pc.yellow('\nYour CV needs at least contact info and one of:'),
			);
			console.log(pc.yellow('  - Work experience'));
			console.log(pc.yellow('  - Education'));
			console.log(pc.yellow('  - Skills'));
			console.log(pc.yellow('\nReturning to menu...'));
			state = await runWizardLoop(state, options);
		}

		action = await confirmSave(state);
	}

	if (action === 'confirm') {
		await writeWizardOutput(state, personDir, locale);
		console.log(pc.green(`\nCV saved to ${path.join(personDir, 'cv.md')}`));
	} else {
		console.log(pc.dim('\nWizard cancelled. No changes saved.'));
	}
}

/**
 * Run wizard to add a single section to an existing CV.
 * Used by `cvgen wizard add <section> <name>` command.
 *
 * @param section - Section to add (experience, skills, project, certification, education)
 * @param options - Wizard options including person directory and locale
 */
export async function runAddSection(
	section: string,
	options: WizardOptions,
): Promise<void> {
	const { personDir, personName } = options;

	// Ensure we're in an interactive terminal
	ensureInteractiveMode();

	// Set up clean exit handler
	setupCleanExit();

	// Load existing CV (required for add commands)
	const cvPath = path.join(personDir, 'cv.md');

	let existingState: WizardState | null = null;
	let locale = options.locale ?? 'en';

	try {
		await access(cvPath);
		const content = await readFile(cvPath, 'utf-8');
		const result = parseCV(content);

		if (result.data) {
			const mode = await selectMode();
			// Prompt for locale if not provided in options
			if (!options.locale) {
				locale = await selectLocale();
			}
			existingState = createStateFromExisting(result.data, mode, locale);
		}
	} catch {
		// File doesn't exist
	}

	if (!existingState) {
		console.log(pc.red(`Error: No CV found at ${cvPath}`));
		console.log(pc.dim("Use 'cvgen wizard init' to create a new CV first."));
		process.exit(1);
	}

	console.log(pc.cyan(`Adding ${section} to CV for ${personName}`));
	const state = existingState;

	// Load job description for enhancement
	const jobDescription = options.enhance
		? await loadJobDescription(options.job)
		: undefined;

	// Build enhancement options
	const enhanceOpts: EnhanceOptions | undefined = options.enhance
		? {
				provider: options.provider,
				jobDescription,
				nonInteractive: false,
				jsonOutput: false,
			}
		: undefined;

	// Call appropriate collector based on section
	switch (section) {
		case 'experience':
			state.experience = await collectExperience(state.mode, state.experience);
			// Apply enhancement after collecting (WIZ-20)
			if (enhanceOpts && state.experience.length > 0) {
				console.log(pc.cyan('\nEnhancing experience bullets with AI...'));
				state.experience = await enhanceSection(
					'experience',
					state.experience,
					enhanceOpts,
				);
			}
			break;

		case 'skills':
			state.skills = await collectSkills(state.mode, state.skills);
			break;

		case 'project':
			state.projects = await collectProjects(state.mode, state.projects);
			break;

		case 'certification':
			state.certifications = await collectCertifications(
				state.mode,
				state.certifications,
			);
			break;

		case 'education':
			state.education = await collectEducation(state.mode, state.education);
			break;

		default:
			console.log(pc.red(`Error: Unknown section '${section}'`));
			console.log(
				pc.dim(
					'Valid sections: experience, skills, project, certification, education',
				),
			);
			process.exit(1);
	}

	// Show mini-summary
	displaySummary(state);

	// Confirm and save
	const action = await confirmSave(state);

	if (action === 'confirm') {
		await writeWizardOutput(state, personDir, locale);
		console.log(pc.green(`\nCV updated at ${path.join(personDir, 'cv.md')}`));
	} else if (action === 'edit') {
		// For add command, 'edit' means go back to adding more
		console.log(pc.dim('\nReturning to add more...'));
		await runAddSection(section, options);
	} else {
		console.log(pc.dim('\nNo changes saved.'));
	}
}
