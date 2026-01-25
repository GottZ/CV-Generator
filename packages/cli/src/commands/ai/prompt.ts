/**
 * AI prompt subcommand.
 * Exports rendered prompts for manual LLM use.
 * Per AI-02: Works without API key configured.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import { parseCV } from '@gottz/cv-core';
import {
	getPromptList,
	getPromptMetadata,
	isValidPrompt,
	PromptError,
	renderPrompt,
} from '../../ai/index.ts';
import {
	createConsole,
	type JsonOutput,
	outputJson,
} from '../../lib/console.ts';
import { personNotFoundError } from '../../lib/fuzzy-matcher.ts';

export interface PromptOptions {
	person?: string;
	locale?: string;
	job?: string; // Job description file for tailor prompt
	quiet?: boolean;
	json?: boolean;
}

const EXIT_FILE_ERROR = 3;
const EXIT_PARSE_ERROR = 1;

/**
 * Export AI prompt for manual use.
 */
export async function promptAction(
	promptName: string | undefined,
	options: PromptOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();

	// If no prompt name, show available prompts
	if (!promptName) {
		showPromptList(cons, options.json);
		return;
	}

	// Validate prompt name
	if (!isValidPrompt(promptName)) {
		cons.error(`Unknown prompt: ${promptName}`);
		cons.info('');
		showPromptList(cons, options.json);
		process.exit(1);
	}

	// We've already validated promptName with isValidPrompt above
	const metadata = getPromptMetadata(promptName);
	if (!metadata) {
		// This should never happen since we validated above
		cons.error(`Unknown prompt: ${promptName}`);
		process.exit(1);
	}

	// Check if CV is required but person not provided
	if (metadata.requiresCV && !options.person) {
		cons.error('This prompt requires a person. Use --person <name>');
		cons.info('');
		cons.info(`Example: cvgen ai prompt ${promptName} --person johndoe`);
		process.exit(1);
	}

	// Check if job description is required but not provided
	if (metadata.requiresJobDescription && !options.job) {
		cons.error('This prompt requires a job description. Use --job <file>');
		cons.info('');
		cons.info(
			`Example: cvgen ai prompt ${promptName} --person johndoe --job job.txt`,
		);
		process.exit(1);
	}

	// Load CV if required
	let cv: CVData | undefined;
	if (metadata.requiresCV && options.person) {
		cv = await loadCVData(cwd, options.person, cons, options.json ?? false);
	}

	// Load job description if provided
	let jobDescription: string | undefined;
	if (options.job) {
		try {
			jobDescription = await readFile(path.resolve(cwd, options.job), 'utf-8');
		} catch {
			cons.error(`Cannot read job description file: ${options.job}`);
			process.exit(EXIT_FILE_ERROR);
		}
	}

	// Determine locale
	const locale = options.locale ?? getDefaultLocale(cv);

	// Render prompt
	// cv is guaranteed to be defined here because requiresCV prompts already exited if !options.person
	// and loadCVData calls process.exit on failure
	try {
		const rendered = renderPrompt(promptName, {
			cv: cv as CVData,
			locale,
			jobDescription,
		});

		if (options.json) {
			const output: JsonOutput & {
				prompt: string;
				metadata: typeof metadata;
			} = {
				status: 'success',
				prompt: rendered,
				metadata,
			};
			outputJson(output);
			return;
		}

		// Output to stdout (pipeable to clipboard, file, etc.)
		console.log(rendered);
	} catch (error) {
		if (error instanceof PromptError) {
			cons.error(error.message);
			process.exit(EXIT_PARSE_ERROR);
		}
		throw error;
	}
}

/**
 * Show list of available prompts.
 */
function showPromptList(
	cons: ReturnType<typeof createConsole>,
	json?: boolean,
): void {
	const prompts = getPromptList();

	if (json) {
		const output: JsonOutput & { prompts: typeof prompts } = {
			status: 'success',
			prompts,
		};
		outputJson(output);
		return;
	}

	cons.info('Available prompts:\n');

	for (const prompt of prompts) {
		cons.info(`  ${prompt.name}`);
		cons.info(`    ${prompt.description}`);
		cons.info(
			`    Stage: ${prompt.stage}${prompt.requiresJobDescription ? ' (requires job description)' : ''}`,
		);
		cons.info('');
	}

	cons.info('Usage: cvgen ai prompt <name> --person <person> [--job <file>]');
}

/**
 * Load CV data for a person.
 */
async function loadCVData(
	cwd: string,
	personName: string,
	cons: ReturnType<typeof createConsole>,
	json: boolean,
): Promise<CVData> {
	const peopleDir = path.join(cwd, 'people');
	const personDir = path.join(peopleDir, personName);
	const cvPath = path.join(personDir, 'cv.md');

	// Check if person directory exists
	try {
		await readdir(personDir);
	} catch {
		let availablePeople: string[] = [];
		try {
			const entries = await readdir(peopleDir, { withFileTypes: true });
			availablePeople = entries
				.filter((e) => e.isDirectory())
				.map((e) => e.name);
		} catch {
			// people directory might not exist
		}

		const err = personNotFoundError(personName, availablePeople);
		if (json) {
			const output: JsonOutput = {
				status: 'error',
				errors: [{ code: EXIT_FILE_ERROR, message: err.message }],
			};
			outputJson(output);
		} else {
			cons.error(err.message);
		}
		process.exit(EXIT_FILE_ERROR);
	}

	// Read and parse CV
	try {
		const cvContent = await readFile(cvPath, 'utf-8');
		const result = parseCV(cvContent);

		if (result.errors.length > 0) {
			if (json) {
				const output: JsonOutput = {
					status: 'error',
					errors: result.errors.map((e) => ({
						code: EXIT_PARSE_ERROR,
						message: e.message,
						line: e.line,
					})),
				};
				outputJson(output);
			} else {
				for (const error of result.errors) {
					cons.error(`Parse error: ${error.message}`);
				}
			}
			process.exit(EXIT_PARSE_ERROR);
		}

		return result.data as CVData;
	} catch {
		const message = `Cannot read CV file: ${cvPath}`;
		if (json) {
			const output: JsonOutput = {
				status: 'error',
				errors: [{ code: EXIT_FILE_ERROR, message }],
			};
			outputJson(output);
		} else {
			cons.error(message);
		}
		process.exit(EXIT_FILE_ERROR);
	}
}

/**
 * Get default locale from CV data.
 */
function getDefaultLocale(cv?: CVData): string {
	if (!cv) return 'en';

	// Try to find a locale from experience or summary
	if (cv.experience) {
		const locales = Object.keys(cv.experience);
		const first = locales[0];
		if (first) return first;
	}
	if (cv.summary) {
		const locales = Object.keys(cv.summary);
		const first = locales[0];
		if (first) return first;
	}

	return 'en';
}
