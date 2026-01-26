/**
 * Non-interactive runner for wizard commands.
 * Orchestrates the full flow: input reading, state building, enhancement, output.
 * Per CONTEXT.md: enables `cvgen wizard init jane --no-input --json-input data.json`
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCV } from '@gottz/cv-core';
import { type EnhanceOptions, enhanceSection } from '../enhance/index.js';
import { writeWizardOutput } from '../markdown-writer.js';
import { createStateFromExisting, isMinimumViable } from '../state.js';
import type { WizardState } from '../types.js';
import { runDryRun } from './dry-run.js';
import type { InitFlagOptions } from './flag-collector.js';
import { readJsonInput } from './input-reader.js';
import { exitWithError, output, progress } from './output-formatter.js';
import { buildWizardState } from './state-builder.js';

/**
 * Options for non-interactive wizard execution.
 */
export interface NonInteractiveOptions {
	/** Person directory path */
	personDir: string;
	/** Person name (directory name) */
	personName: string;
	/** Locale for localized sections */
	locale: string;
	/** CLI flags for input */
	flags: InitFlagOptions;
	/** JSON input file path or '-' for stdin */
	jsonInput?: string;
	/** Dry-run mode (validate only) */
	dryRun: boolean;
	/** Enable AI enhancement */
	enhance: boolean;
	/** AI provider name */
	provider?: string;
	/** Job description file for tailored enhancement */
	job?: string;
	/** JSON output mode */
	json: boolean;
}

/**
 * Success result from non-interactive wizard.
 */
export interface NonInteractiveResult {
	success: true;
	path: string;
	section?: string;
}

/**
 * Run wizard init in non-interactive mode.
 * Reads input from flags or JSON, optionally enhances with AI, writes CV.
 *
 * @param options - Non-interactive execution options
 */
export async function runNonInteractiveWizard(
	options: NonInteractiveOptions,
): Promise<void> {
	progress(`Creating CV for ${options.personName}...`, options.json);

	// Read JSON input if provided
	let jsonData: unknown | undefined;
	if (options.jsonInput) {
		progress('Reading JSON input...', options.json);
		try {
			jsonData = await readJsonInput(options.jsonInput);
		} catch {
			exitWithError(
				'Failed to read JSON input',
				{
					code: 'INPUT_READ_ERROR',
					context: { source: options.jsonInput },
					suggestions: [
						'Ensure the file exists and is readable',
						'Check that the content is valid JSON',
						'Use "-" to read from stdin',
					],
				},
				options.json,
				'VALIDATION_ERROR',
			);
		}
	}

	// Build wizard state from input
	progress('Building wizard state...', options.json);
	const state = buildWizardState(jsonData, options.flags, options.json);

	// Validate minimum viable CV
	if (!isMinimumViable(state)) {
		exitWithError(
			'CV requires at least contact info and one of: experience, education, or skills',
			{
				code: 'MINIMUM_VIABLE_ERROR',
				context: {
					hasContact: !!state.contact,
					experienceCount: state.experience.length,
					educationCount: state.education.length,
					skillsCount: state.skills.length,
				},
				suggestions: [
					'Provide contact info with at least a name',
					'Add at least one experience, education, or skills entry',
					'Use --json-input with complete data',
				],
			},
			options.json,
			'VALIDATION_ERROR',
		);
	}

	// Apply AI enhancement if requested
	let finalState = state;
	if (options.enhance) {
		finalState = await applyEnhancement(state, options);
	}

	// Dry-run or write
	if (options.dryRun) {
		await runDryRun(
			finalState,
			options.personDir,
			options.locale,
			options.json,
		);
		return;
	}

	// Write output
	progress('Writing CV...', options.json);
	await writeWizardOutput(finalState, options.personDir, options.locale);

	const cvPath = path.join(options.personDir, 'cv.md');
	const result: NonInteractiveResult = { success: true, path: cvPath };

	if (options.json) {
		output(result, true);
	} else {
		console.log(`\n\u2713 CV created at ${cvPath}`);
	}
}

/**
 * Apply AI enhancement to wizard state.
 *
 * @param state - Current wizard state
 * @param options - Non-interactive options with enhancement settings
 * @returns Enhanced wizard state
 */
async function applyEnhancement(
	state: WizardState,
	options: NonInteractiveOptions,
): Promise<WizardState> {
	// Read job description if provided
	let jobDescription: string | undefined;
	if (options.job) {
		try {
			jobDescription = await readFile(options.job, 'utf-8');
		} catch {
			progress(
				`Warning: Could not read job description from ${options.job}`,
				options.json,
			);
		}
	}

	const enhanceOpts: EnhanceOptions = {
		provider: options.provider,
		jobDescription,
		nonInteractive: true, // Auto-accept all in non-interactive per CONTEXT.md
		jsonOutput: options.json,
	};

	progress('Enhancing content with AI...', options.json);

	let enhancedState = state;

	// Enhance experience bullets (primary AI enhancement target per 19-05)
	if (state.experience.length > 0) {
		enhancedState = {
			...enhancedState,
			experience: await enhanceSection(
				'experience',
				state.experience,
				enhanceOpts,
			),
		};
	}

	return enhancedState;
}

/**
 * Section types that can be added.
 */
export type AddableSection =
	| 'experience'
	| 'education'
	| 'skills'
	| 'projects'
	| 'certifications';

/**
 * Run wizard add section in non-interactive mode.
 * Similar to init but for adding to existing CV.
 *
 * @param section - Section to add (experience, education, etc.)
 * @param options - Non-interactive execution options
 */
export async function runNonInteractiveAdd(
	section: AddableSection,
	options: NonInteractiveOptions,
): Promise<void> {
	progress(
		`Adding ${section} to CV for ${options.personName}...`,
		options.json,
	);

	// Read JSON input
	let jsonData: unknown | undefined;
	if (options.jsonInput) {
		progress('Reading JSON input...', options.json);
		try {
			jsonData = await readJsonInput(options.jsonInput);
		} catch {
			exitWithError(
				'Failed to read JSON input',
				{
					code: 'INPUT_READ_ERROR',
					context: { source: options.jsonInput },
				},
				options.json,
				'VALIDATION_ERROR',
			);
		}
	}

	// For add commands, we need the existing CV
	const cvPath = path.join(options.personDir, 'cv.md');

	try {
		await access(cvPath);
	} catch {
		exitWithError(
			`No CV found at ${cvPath}. Use 'cvgen wizard init' first.`,
			{
				code: 'CV_NOT_FOUND',
				context: { path: cvPath },
				suggestions: [
					"Run 'cvgen wizard init' to create a CV first",
					'Specify the correct person name',
				],
			},
			options.json,
			'VALIDATION_ERROR',
		);
	}

	const content = await readFile(cvPath, 'utf-8');
	const parseResult = parseCV(content);

	if (!parseResult.data) {
		exitWithError(
			'Failed to parse existing CV',
			{
				code: 'CV_PARSE_ERROR',
				context: {
					path: cvPath,
					errors: parseResult.errors?.map((e) => e.message),
				},
			},
			options.json,
			'GENERAL_ERROR',
		);
	}

	// Build state from existing CV
	const existingState = createStateFromExisting(
		parseResult.data,
		'quick',
		options.locale,
	);

	// Build new section state from input
	const newState = buildWizardState(jsonData, options.flags, options.json);

	// Merge section into existing state
	const mergedState = mergeSection(existingState, newState, section);

	// Apply enhancement if requested
	let finalState = mergedState;
	if (options.enhance && section === 'experience') {
		finalState = await applyEnhancement(mergedState, options);
	}

	// Dry-run or write
	if (options.dryRun) {
		await runDryRun(
			finalState,
			options.personDir,
			options.locale,
			options.json,
		);
		return;
	}

	// Write output
	progress('Writing updated CV...', options.json);
	await writeWizardOutput(finalState, options.personDir, options.locale);

	const result: NonInteractiveResult = {
		success: true,
		path: cvPath,
		section,
	};

	if (options.json) {
		output(result, true);
	} else {
		console.log(`\n\u2713 Added ${section} to CV at ${cvPath}`);
	}
}

/**
 * Merge a section from new state into existing state.
 *
 * @param existing - Existing wizard state
 * @param newData - New data to merge
 * @param section - Section being added
 * @returns Merged wizard state
 */
function mergeSection(
	existing: WizardState,
	newData: WizardState,
	section: AddableSection,
): WizardState {
	const merged = { ...existing };

	switch (section) {
		case 'experience':
			merged.experience = [...existing.experience, ...newData.experience];
			break;
		case 'education':
			merged.education = [...existing.education, ...newData.education];
			break;
		case 'skills':
			merged.skills = [...existing.skills, ...newData.skills];
			break;
		case 'projects':
			merged.projects = [...existing.projects, ...newData.projects];
			break;
		case 'certifications':
			merged.certifications = [
				...existing.certifications,
				...newData.certifications,
			];
			break;
	}

	return merged;
}
