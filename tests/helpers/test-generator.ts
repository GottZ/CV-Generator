/**
 * Test CV generator helper.
 *
 * Provides utilities to generate CV outputs for testing purposes,
 * using the CLI build command internally.
 */

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/** Template options for CV generation */
export type TemplateType = 'modern' | 'minimal' | 'classic';

/** Available test fixture options */
export type FixtureType = 'sample-cv' | 'multi-page-cv';

/**
 * Options for generating a test CV.
 */
export interface TestCvOptions {
	/** Template to use for generation */
	template: TemplateType;
	/** Fixture to use as source CV data */
	fixture: FixtureType;
	/** Locale to generate (defaults to 'en') */
	locale?: string;
}

/**
 * Result from generating a test CV.
 */
export interface TestCvResult {
	/** Path to the generated HTML file */
	html: string;
	/** Path to the generated PDF file */
	pdf: string;
	/** Path to the generated DOCX file */
	docx: string;
	/** Output directory containing all files */
	outputDir: string;
}

/** Root directory for test outputs */
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output');

/** Directory containing test fixtures */
const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'fixtures');

/** Directory containing templates */
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

/**
 * Generate a test CV with the specified options.
 *
 * Creates HTML, PDF, and DOCX outputs using the CLI build command.
 * Outputs are placed in tests/output/{fixture}_{template}/ directory.
 *
 * @param options - Generation options including template and fixture
 * @returns Promise resolving to paths for all generated files
 * @throws Error if generation fails
 *
 * @example
 * ```ts
 * const result = await generateTestCv({
 *   template: 'modern',
 *   fixture: 'sample-cv'
 * });
 * expect(result.pdf).toContain('.pdf');
 * ```
 */
export async function generateTestCv(
	options: TestCvOptions,
): Promise<TestCvResult> {
	const { template, fixture, locale = 'en' } = options;

	// Create output directory structure
	// We need to create a temporary "person" directory for the CLI
	const personName = `${fixture}_${template}`;
	const personDir = path.join(TEST_OUTPUT_DIR, personName);
	const outputDir = path.join(personDir, 'output');

	// Create directories
	await mkdir(personDir, { recursive: true });

	// Copy fixture to person directory as cv.md
	const fixturePath = path.join(FIXTURES_DIR, `${fixture}.md`);
	const cvPath = path.join(personDir, 'cv.md');
	const fixtureContent = await Bun.file(fixturePath).text();
	await Bun.write(cvPath, fixtureContent);

	// Run the CLI build command
	const cliPath = path.join(
		process.cwd(),
		'packages',
		'cli',
		'src',
		'index.ts',
	);

	const proc = Bun.spawn(
		[
			'bun',
			'run',
			cliPath,
			'build',
			personName,
			template,
			'--locale',
			locale,
			'--format',
			'html,pdf,docx',
			'--quiet',
		],
		{
			cwd: process.cwd(),
			env: {
				...process.env,
				// Point to test output directory for people
				CVGEN_PEOPLE_DIR: TEST_OUTPUT_DIR,
				// Use standard templates directory
				CVGEN_TEMPLATES_DIR: TEMPLATES_DIR,
			},
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);

	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(
			`CV generation failed with exit code ${exitCode}: ${stderr}`,
		);
	}

	// Determine expected output filenames
	// The CLI uses slug from frontmatter, falling back to directory name
	// Our fixtures use the person name as slug
	const slug = personName;
	const baseName = `${slug}_${template}_${locale}`;

	return {
		html: path.join(outputDir, `${baseName}.html`),
		pdf: path.join(outputDir, `${baseName}.pdf`),
		docx: path.join(outputDir, `${baseName}.docx`),
		outputDir,
	};
}

/**
 * Clean up all test output files.
 *
 * Removes the entire tests/output directory and its contents.
 *
 * @example
 * ```ts
 * afterAll(async () => {
 *   await cleanupTestOutput();
 * });
 * ```
 */
export async function cleanupTestOutput(): Promise<void> {
	try {
		await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
	} catch {
		// Ignore errors if directory doesn't exist
	}
}

/**
 * Check if a generated output file exists.
 *
 * @param filePath - Path to the file to check
 * @returns Promise resolving to true if file exists
 */
export async function outputExists(filePath: string): Promise<boolean> {
	return await Bun.file(filePath).exists();
}
