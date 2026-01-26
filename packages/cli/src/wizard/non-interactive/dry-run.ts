/**
 * Dry-run mode for non-interactive wizard.
 * Validates without writing files and previews generated content.
 * Per CONTEXT.md: --dry-run flag to validate without writing files.
 */

import path from 'node:path';
import { parseCV } from '@gottz/cv-core';
import { generateMarkdown } from '../markdown-writer.js';
import type { WizardState } from '../types.js';
import { output, progress } from './output-formatter.js';

/**
 * Result of a dry-run operation.
 */
export interface DryRunResult {
	/** Whether the generated CV is valid */
	valid: boolean;
	/** Files that would be written */
	wouldWrite: string[];
	/** Preview of generated content */
	preview: Array<{
		path: string;
		content: string;
	}>;
	/** Validation errors if any */
	validationErrors?: string[];
}

/**
 * Run wizard in dry-run mode.
 * Validates input and previews output without writing files.
 *
 * @param state - Wizard state to validate
 * @param personDir - Target person directory
 * @param locale - Locale for localized sections
 * @param jsonOutput - Whether to output as JSON
 * @returns Dry-run result with validation status and preview
 */
export async function runDryRun(
	state: WizardState,
	personDir: string,
	locale: string,
	jsonOutput: boolean,
): Promise<DryRunResult> {
	progress('Validating CV data...', jsonOutput);

	// Generate markdown without writing
	const markdown = generateMarkdown(state, locale);
	const cvPath = path.join(personDir, 'cv.md');

	// Validate generated content against cv-core schema
	const parseResult = parseCV(markdown);

	const result: DryRunResult = {
		valid:
			!!parseResult.data &&
			(!parseResult.errors || parseResult.errors.length === 0),
		wouldWrite: [cvPath],
		preview: [{ path: cvPath, content: markdown }],
		validationErrors: parseResult.errors?.map((e) => e.message),
	};

	if (jsonOutput) {
		output(result, true);
	} else {
		// Human-readable output
		if (result.valid) {
			console.log('\n\u2713 Validation passed');
		} else {
			console.log('\n\u2717 Validation failed');
			if (result.validationErrors) {
				for (const error of result.validationErrors) {
					console.log(`  - ${error}`);
				}
			}
		}

		console.log(`\nWould write: ${result.wouldWrite.join(', ')}`);
		console.log('\n--- Preview ---');
		console.log(markdown);
		console.log('--- End Preview ---');
	}

	return result;
}
