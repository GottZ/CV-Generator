import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import { parseCV } from '@gottz/cv-core';
import { discoverTemplates, renderCV } from '@gottz/cv-templates';
import {
	type ConsoleResult,
	createConsole,
	type JsonOutput,
	outputJson,
} from '../lib/console.ts';
import { createWatcher, parseWatchFilter } from '../lib/file-watcher.ts';
import { templateNotFoundError } from '../lib/fuzzy-matcher.ts';
import { embedImages } from '../lib/html-embedder.ts';
import { type WriteResult, writeOutput } from '../lib/output-writer.ts';

export interface BuildOptions {
	format?: string;
	locale?: string;
	watch?: string | boolean;
	parallel?: boolean;
	sequential?: boolean;
	quiet?: boolean;
	json?: boolean;
}

// Exit codes per CONTEXT.md
const EXIT_PARSE_ERROR = 1;
const EXIT_TEMPLATE_ERROR = 2;
const EXIT_FILE_ERROR = 3;

/**
 * Build action - main entry point for build command.
 */
export async function buildAction(
	name: string,
	template: string,
	options: BuildOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();
	const peopleDir = path.join(cwd, 'people');
	const templatesDir = path.join(cwd, 'templates');
	const personDir = path.join(peopleDir, name);

	// Watch mode
	if (options.watch) {
		const filter = parseWatchFilter(options.watch);
		cons.info('Watching for changes... (Ctrl+C to stop)');

		const watcher = createWatcher({
			peopleDir,
			templatesDir,
			filter,
			onRebuild: async (changed) => {
				cons.info(`Change detected: ${path.relative(cwd, changed)}`);
				try {
					await runBuild(
						name,
						template,
						options,
						cons,
						personDir,
						templatesDir,
					);
				} catch (err) {
					cons.error((err as Error).message);
				}
			},
		});

		// Initial build
		try {
			await runBuild(name, template, options, cons, personDir, templatesDir);
		} catch (err) {
			cons.error((err as Error).message);
		}

		// Keep process alive
		process.on('SIGINT', () => {
			watcher.close();
			process.exit(0);
		});

		return;
	}

	// Single build
	try {
		await runBuild(name, template, options, cons, personDir, templatesDir);
	} catch (err) {
		const error = err as Error & { code?: number };
		cons.error(error.message);
		process.exit(error.code ?? 1);
	}
}

/**
 * Run a single build.
 */
async function runBuild(
	_name: string,
	templateId: string,
	options: BuildOptions,
	cons: ConsoleResult,
	personDir: string,
	templatesDir: string,
): Promise<void> {
	const results: WriteResult[] = [];
	const warnings: string[] = [];

	// 1. Validate person directory exists
	const cvPath = path.join(personDir, 'cv.md');
	const cvFile = Bun.file(cvPath);
	if (!(await cvFile.exists())) {
		const err = new Error(`CV not found: ${cvPath}`);
		(err as Error & { code: number }).code = EXIT_FILE_ERROR;
		throw err;
	}

	// 2. Validate template exists
	const templates = await discoverTemplates(templatesDir);
	const templateIds = templates.map((t) => t.id);
	if (!templateIds.includes(templateId)) {
		const err = templateNotFoundError(templateId, templateIds);
		(err as Error & { code: number }).code = EXIT_TEMPLATE_ERROR;
		throw err;
	}

	// 3. Parse CV
	const cvContent = await cvFile.text();
	const parseResult = parseCV(cvContent);

	if (parseResult.errors.length > 0) {
		const err = new Error(
			`Parse error: ${parseResult.errors.map((e) => e.message).join(', ')}`,
		);
		(err as Error & { code: number }).code = EXIT_PARSE_ERROR;
		throw err;
	}

	// Safe assertion: we checked errors.length === 0 above, so data exists
	const cv = parseResult.data as CVData;

	// Add parse warnings
	for (const w of parseResult.warnings) {
		warnings.push(w.message);
	}

	// 4. Determine locales to build
	// Per CONTEXT.md: default builds all locales in CV
	const requestedLocales = options.locale?.split(',').map((l) => l.trim());
	const availableLocales = getAvailableLocales(cv);

	const localesToBuild = requestedLocales
		? requestedLocales.filter((l) => availableLocales.includes(l))
		: availableLocales;

	if (localesToBuild.length === 0) {
		const err = new Error(
			`No matching locales. Requested: ${requestedLocales?.join(', ')}, Available: ${availableLocales.join(', ')}`,
		);
		(err as Error & { code: number }).code = EXIT_PARSE_ERROR;
		throw err;
	}

	// 5. Determine formats to build (only html for now)
	const formats = (options.format ?? 'html,pdf,docx')
		.split(',')
		.map((f) => f.trim());
	const supportedFormats = ['html']; // PDF and DOCX added in later phases

	// 6. Build for each locale and format
	for (const locale of localesToBuild) {
		for (const format of formats) {
			if (!supportedFormats.includes(format)) {
				warnings.push(`Format "${format}" not yet supported, skipping`);
				continue;
			}

			if (format === 'html') {
				const result = await buildHtml(
					cv,
					locale,
					templateId,
					personDir,
					templatesDir,
				);
				results.push(result.writeResult);
				warnings.push(...result.warnings);
			}
		}
	}

	// 7. Output results
	if (options.json) {
		const output: JsonOutput = {
			status: 'success',
			files: results.map((r) => ({
				path: r.path,
				bytes: r.bytes,
				overwritten: r.overwritten,
			})),
			warnings: warnings.length > 0 ? warnings : undefined,
		};
		outputJson(output);
	} else {
		// Display warnings
		for (const warning of warnings) {
			cons.warn(warning);
		}

		// Display success for each file
		for (const result of results) {
			const sizeKB = Math.round(result.bytes / 1024);
			const action = result.overwritten ? 'Overwrote existing' : 'Generated';
			const relativePath = path.relative(process.cwd(), result.path);
			cons.success(`${action} ${relativePath} (${sizeKB}KB)`);
		}
	}
}

/**
 * Build HTML output for a single locale.
 */
async function buildHtml(
	cv: CVData,
	locale: string,
	templateId: string,
	personDir: string,
	templatesDir: string,
): Promise<{ writeResult: WriteResult; warnings: string[] }> {
	const warnings: string[] = [];

	// Render template
	const renderResult = await renderCV(cv, { templateId, locale }, templatesDir);

	// Embed images
	const imagesDir = path.join(personDir, 'images');
	const embedResult = await embedImages(renderResult.html, imagesDir);
	warnings.push(...embedResult.warnings);

	// Determine filename per CONTEXT.md
	// slug from frontmatter, fallback to directory name
	const slug = cv.contact.slug?.trim() || path.basename(personDir);
	const filename = `${slug}_${templateId}_${locale}.html`;

	// Write output
	const outputDir = path.join(personDir, 'output');
	const writeResult = await writeOutput(outputDir, filename, embedResult.html);

	return { writeResult, warnings };
}

/**
 * Get all available locales from CV data.
 */
function getAvailableLocales(cv: CVData): string[] {
	const locales = new Set<string>();

	for (const section of [cv.summary, cv.experience, cv.education, cv.skills]) {
		if (section) {
			for (const locale of Object.keys(section)) {
				locales.add(locale);
			}
		}
	}

	return Array.from(locales);
}
