import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import { parseCV } from '@gottz/cv-core';
import { createConsole, type JsonOutput, outputJson } from '../lib/console.ts';
import { personNotFoundError } from '../lib/fuzzy-matcher.ts';

export interface ValidateOptions {
	locale?: string;
	quiet?: boolean;
	json?: boolean;
}

/**
 * Validation statistics per RESEARCH.md Pattern 6.
 */
interface ValidationStats {
	sections: number;
	jobs: number;
	degrees: number;
	skillCategories: number;
	locales: string[];
}

// Exit codes per CONTEXT.md
const EXIT_PARSE_ERROR = 1;
const EXIT_FILE_ERROR = 3;

/**
 * Gather statistics from parsed CV data.
 */
function gatherStats(cv: CVData): ValidationStats {
	const locales = new Set<string>();
	let jobs = 0;
	let degrees = 0;
	let skillCategories = 0;

	// Count experience entries
	if (cv.experience) {
		for (const [locale, entries] of Object.entries(cv.experience)) {
			locales.add(locale);
			jobs += entries.length;
		}
	}

	// Count education entries
	if (cv.education) {
		for (const [locale, entries] of Object.entries(cv.education)) {
			locales.add(locale);
			degrees += entries.length;
		}
	}

	// Count skill categories
	if (cv.skills) {
		for (const [locale, categories] of Object.entries(cv.skills)) {
			locales.add(locale);
			skillCategories += categories.length;
		}
	}

	// Count summary locales
	if (cv.summary) {
		for (const locale of Object.keys(cv.summary)) {
			locales.add(locale);
		}
	}

	// Count sections (excluding contact)
	const sections = Object.keys(cv).filter((k) => k !== 'contact').length;

	return {
		sections,
		jobs,
		degrees,
		skillCategories,
		locales: Array.from(locales).sort(),
	};
}

/**
 * Validate command action - check CV markdown against schema without generating files.
 */
export async function validateAction(
	name: string,
	options: ValidateOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();
	const peopleDir = path.join(cwd, 'people');
	const personDir = path.join(peopleDir, name);
	const cvPath = path.join(personDir, 'cv.md');

	// Check person directory exists by trying to read it
	let personExists = false;
	try {
		const entries = await readdir(personDir).catch(() => null);
		personExists = entries !== null;
	} catch {
		personExists = false;
	}

	if (!personExists) {
		// List available people for suggestions
		let availablePeople: string[] = [];
		try {
			const entries = await readdir(peopleDir, { withFileTypes: true });
			availablePeople = entries
				.filter((e) => e.isDirectory())
				.map((e) => e.name);
		} catch {
			// people directory might not exist
		}

		const err = personNotFoundError(name, availablePeople);
		(err as Error & { code: number }).code = EXIT_FILE_ERROR;

		if (options.json) {
			const output: JsonOutput = {
				status: 'error',
				errors: [{ code: EXIT_FILE_ERROR, message: err.message }],
			};
			outputJson(output);
			process.exit(EXIT_FILE_ERROR);
		}

		cons.error(err.message);
		process.exit(EXIT_FILE_ERROR);
	}

	// Check cv.md exists
	const cvFile = Bun.file(cvPath);
	if (!(await cvFile.exists())) {
		const message = `CV file not found: ${cvPath}\n\nTry: Create cv.md in people/${name}/`;

		if (options.json) {
			const output: JsonOutput = {
				status: 'error',
				errors: [{ code: EXIT_FILE_ERROR, message }],
			};
			outputJson(output);
			process.exit(EXIT_FILE_ERROR);
		}

		cons.error(message);
		process.exit(EXIT_FILE_ERROR);
	}

	// Parse CV
	const cvContent = await cvFile.text();
	const parseResult = parseCV(cvContent);

	// Handle parse errors
	if (parseResult.errors.length > 0) {
		if (options.json) {
			const output: JsonOutput = {
				status: 'error',
				errors: parseResult.errors.map((e) => ({
					code: EXIT_PARSE_ERROR,
					message: e.message,
					line: e.line,
				})),
			};
			outputJson(output);
			process.exit(EXIT_PARSE_ERROR);
		}

		// Format errors with line numbers and suggestions
		for (const error of parseResult.errors) {
			const lineInfo = error.line ? ` (line ${error.line})` : '';
			cons.error(`Parse error${lineInfo}: ${error.message}`);
		}

		// Common fix suggestions
		cons.info('\nTry: Check YAML frontmatter syntax and section headers');
		process.exit(EXIT_PARSE_ERROR);
	}

	// Safe assertion: we checked errors.length === 0 above, so data exists
	const cv = parseResult.data as CVData;

	// Show parse warnings
	for (const warning of parseResult.warnings) {
		cons.warn(warning.message);
	}

	// Check requested locale (if --locale specified)
	if (options.locale) {
		const stats = gatherStats(cv);
		if (!stats.locales.includes(options.locale)) {
			cons.warn(
				`Requested locale "${options.locale}" not found in CV. Available: ${stats.locales.join(', ')}`,
			);
		}
	}

	// Gather and display stats
	const stats = gatherStats(cv);

	if (options.json) {
		const output: JsonOutput & { stats: ValidationStats } = {
			status: 'success',
			stats,
		};
		console.log(JSON.stringify(output, null, 2));
		return;
	}

	// Per CONTEXT.md: "Valid: 4 sections, 3 jobs, 2 degrees"
	cons.success(
		`Valid: ${stats.sections} sections, ${stats.jobs} jobs, ${stats.degrees} degrees`,
	);
	cons.info(`Skill categories: ${stats.skillCategories}`);
	cons.info(`Locales: ${stats.locales.join(', ')}`);
}
