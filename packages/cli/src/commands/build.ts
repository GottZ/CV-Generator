import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import { parseCV } from '@gottz/cv-core';
import { discoverTemplates, renderCV } from '@gottz/cv-templates';
import { closeBrowser } from '../lib/browser-manager.ts';
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
import { addPdfBookmarks, getDefaultSections } from '../lib/pdf-bookmarks.ts';
import { generatePdf } from '../lib/pdf-generator.ts';
import { setPdfMetadata } from '../lib/pdf-metadata.ts';

export interface BuildOptions {
	format?: string;
	locale?: string;
	watch?: string | boolean;
	parallel?: boolean;
	sequential?: boolean;
	quiet?: boolean;
	json?: boolean;
	htmlOnly?: boolean;
	noPdf?: boolean;
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

	// 5. Determine formats to build
	let formats = (options.format ?? 'html,pdf,docx')
		.split(',')
		.map((f) => f.trim());
	const supportedFormats = ['html', 'pdf'];

	// Handle --html-only and --no-pdf flags
	if (options.htmlOnly || options.noPdf) {
		formats = formats.filter((f) => f !== 'pdf');
	}

	// 6. Build for each locale and format
	// Track HTML paths for PDF generation (PDF requires HTML first)
	const htmlPaths: Map<string, string> = new Map();

	try {
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
					// Store HTML path for PDF generation
					htmlPaths.set(locale, result.writeResult.path);
				}

				if (format === 'pdf') {
					// Ensure HTML exists (build if needed)
					let htmlPath = htmlPaths.get(locale);
					if (!htmlPath) {
						const htmlResult = await buildHtml(
							cv,
							locale,
							templateId,
							personDir,
							templatesDir,
						);
						htmlPath = htmlResult.writeResult.path;
						// Don't add HTML to results if user only requested PDF
						if (formats.includes('html')) {
							results.push(htmlResult.writeResult);
						}
						warnings.push(...htmlResult.warnings);
						htmlPaths.set(locale, htmlPath);
					}

					const pdfResult = await buildPdf(
						cv,
						locale,
						templateId,
						personDir,
						htmlPath,
						cons,
					);
					results.push(pdfResult.writeResult);
					warnings.push(...pdfResult.warnings);
				}
			}
		}
	} finally {
		// Always close browser to free resources (RESEARCH.md Pitfall 5)
		await closeBrowser();
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
 * Retry configuration for PDF generation.
 */
interface RetryOptions {
	maxRetries: number;
	initialTimeoutMs: number;
	backoffMultiplier: number;
}

/**
 * Execute an operation with retry logic and exponential backoff.
 *
 * @param operation - Async function that takes timeout and returns result
 * @param options - Retry configuration
 * @param cons - Console for logging
 * @returns Promise<T> - Result of successful operation
 */
async function withRetry<T>(
	operation: (timeoutMs: number) => Promise<T>,
	options: RetryOptions = {
		maxRetries: 3,
		initialTimeoutMs: 30000,
		backoffMultiplier: 2,
	},
	cons: ConsoleResult,
): Promise<T> {
	let lastError: Error | null = null;
	let timeoutMs = options.initialTimeoutMs;

	for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
		try {
			return await operation(timeoutMs);
		} catch (error) {
			lastError = error as Error;
			cons.warn(
				`PDF generation attempt ${attempt}/${options.maxRetries} failed: ${lastError.message}`,
			);

			if (attempt < options.maxRetries) {
				timeoutMs *= options.backoffMultiplier;
				cons.info(`Retrying with ${timeoutMs}ms timeout...`);
			}
		}
	}

	throw lastError ?? new Error('PDF generation failed after retries');
}

/**
 * Build PDF output for a single locale.
 *
 * Generates PDF from HTML with metadata and bookmarks.
 * Uses retry logic for reliability.
 */
async function buildPdf(
	cv: CVData,
	locale: string,
	templateId: string,
	personDir: string,
	htmlPath: string,
	cons: ConsoleResult,
): Promise<{ writeResult: WriteResult; warnings: string[] }> {
	const warnings: string[] = [];

	// Determine output filename and path
	const slug = cv.contact.slug?.trim() || path.basename(personDir);
	const filename = `${slug}_${templateId}_${locale}.pdf`;
	const outputPath = path.join(personDir, 'output', filename);

	// Step 1: Generate initial PDF with retry logic
	cons.info('Generating PDF...');

	try {
		const pdfResult = await withRetry(
			(timeout) =>
				generatePdf({
					htmlPath,
					outputPath,
					name: cv.contact.name,
					locale,
					timeout,
				}),
			{ maxRetries: 3, initialTimeoutMs: 30000, backoffMultiplier: 2 },
			cons,
		);

		// Read generated PDF buffer for post-processing
		const pdfArrayBuffer = await Bun.file(pdfResult.path).arrayBuffer();
		let pdfData: Buffer = Buffer.from(pdfArrayBuffer);

		// Step 2: Add metadata
		cons.info('Adding PDF metadata...');
		pdfData = await setPdfMetadata(pdfData, {
			title: `${cv.contact.name} - CV`,
			author: cv.contact.name,
			subject: 'Curriculum Vitae',
		});

		// Step 3: Add bookmarks
		cons.info('Adding PDF bookmarks...');
		const sections = getDefaultSections(locale);
		pdfData = await addPdfBookmarks(pdfData, sections);

		// Step 4: Write final processed PDF
		await Bun.write(outputPath, pdfData);

		// Check if file existed before (always false here since we just wrote it)
		const overwritten = pdfResult.bytes > 0;

		return {
			writeResult: {
				path: outputPath,
				bytes: pdfData.length,
				overwritten,
			},
			warnings,
		};
	} catch (error) {
		// Clean up partial PDF on failure
		try {
			const partialFile = Bun.file(outputPath);
			if (await partialFile.exists()) {
				// Delete the file using fs/promises
				const { unlink } = await import('node:fs/promises');
				await unlink(outputPath);
			}
		} catch {
			// Ignore cleanup errors
		}
		throw error;
	}
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
