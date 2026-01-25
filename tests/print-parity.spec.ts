/**
 * Print parity verification tests.
 *
 * Verifies that browser Ctrl+P print output matches CLI-generated PDF output
 * across all three templates (Modern, Minimal, Classic).
 *
 * These tests:
 * 1. Generate CLI PDF using existing test-generator infrastructure
 * 2. Generate browser PDF using Playwright page.pdf()
 * 3. Compare page counts (critical for PRINT-01)
 * 4. Store artifacts for manual review
 *
 * Run on-demand only (not in CI): npx playwright test print-parity
 */

import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
	BROWSER_PDF_OPTIONS,
	compareForParity,
	type ParityResult,
} from './helpers/parity-utils';
import { getPdfPageCount } from './helpers/pdf-utils';
import {
	type FixtureType,
	generateTestCv,
	type TemplateType,
	type TestCvResult,
} from './helpers/test-generator';

/** Output directory for parity test artifacts */
const PARITY_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output', 'parity');

/** Templates to test for PRINT-05 */
const TEMPLATES: TemplateType[] = ['modern', 'minimal', 'classic'];

/** Fixtures to test */
const FIXTURES: FixtureType[] = ['sample-cv', 'multi-page-cv'];

test.describe('Print parity verification', () => {
	// Run tests sequentially to ensure deterministic output
	test.describe.configure({ mode: 'serial' });

	// Store results for summary
	const results: Map<string, ParityResult> = new Map();

	test.beforeAll(async () => {
		// Create output directory for artifacts
		await mkdir(PARITY_OUTPUT_DIR, { recursive: true });
	});

	test.afterAll(async () => {
		// Log summary of all results
		console.log('\n=== Print Parity Summary ===');
		for (const [key, result] of results) {
			const status = result.match ? 'PASS' : 'FAIL';
			console.log(
				`${status}: ${key} (CLI: ${result.cliPageCount} pages, Browser: ${result.browserPageCount} pages)`,
			);
			if (result.issues.length > 0) {
				for (const issue of result.issues) {
					console.log(`  - ${issue}`);
				}
			}
		}
		console.log('============================\n');

		// Note: Do not cleanup - keep artifacts for manual review
		// Artifacts are in tests/output/parity/
	});

	for (const template of TEMPLATES) {
		test.describe(`${template} template`, () => {
			for (const fixture of FIXTURES) {
				test(`${fixture} print parity`, async ({ page }) => {
					const testKey = `${template}-${fixture}`;

					// Step 1: Generate CLI PDF using existing infrastructure
					const cliResult: TestCvResult = await generateTestCv({
						template,
						fixture,
					});

					// Step 2: Open HTML in browser and generate PDF via Playwright
					await page.goto(`file://${cliResult.html}`);
					await page.waitForLoadState('networkidle');

					// Wait for fonts to be ready (matches pdf-generator.ts behavior)
					await page.evaluate(() => document.fonts.ready);

					const browserPdfPath = path.join(
						PARITY_OUTPUT_DIR,
						`${template}-${fixture}-browser.pdf`,
					);

					await page.pdf({
						...BROWSER_PDF_OPTIONS,
						path: browserPdfPath,
					});

					// Step 3: Compare PDFs for parity
					const parityResult = await compareForParity(
						cliResult.pdf,
						browserPdfPath,
					);
					results.set(testKey, parityResult);

					// Step 4: Store CLI PDF copy for comparison
					// (Useful for manual side-by-side review)
					await copyFile(
						cliResult.pdf,
						path.join(PARITY_OUTPUT_DIR, `${template}-${fixture}-cli.pdf`),
					);

					// Step 5: Assert page counts match (PRINT-01)
					expect(
						parityResult.browserPageCount,
						`Page count mismatch for ${testKey}: CLI=${parityResult.cliPageCount}, Browser=${parityResult.browserPageCount}`,
					).toBe(parityResult.cliPageCount);

					// Step 6: Assert no issues found
					expect(
						parityResult.issues,
						`Parity issues found for ${testKey}`,
					).toHaveLength(0);
				});
			}
		});
	}
});

/**
 * Known limitations test - documents expected differences.
 *
 * These are not failures, but documented behaviors.
 */
test.describe('Known limitations', () => {
	test('browser PDF lacks CLI footer', async ({ page }) => {
		// This test documents that browser print PDFs don't have the
		// name + page number footer that CLI PDFs have.
		// This is expected behavior - the footer is injected by Puppeteer
		// at generation time, not embedded in the HTML.

		const cliResult = await generateTestCv({
			template: 'modern',
			fixture: 'sample-cv',
		});

		await page.goto(`file://${cliResult.html}`);
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => document.fonts.ready);

		// Create output directory if needed
		await mkdir(PARITY_OUTPUT_DIR, { recursive: true });

		// Generate browser PDF without footer
		const browserPdfPath = path.join(
			PARITY_OUTPUT_DIR,
			'limitation-no-footer.pdf',
		);

		await page.pdf({
			...BROWSER_PDF_OPTIONS,
			path: browserPdfPath,
			// Note: No footerTemplate - browser print doesn't have this feature
		});

		// Page counts should still match despite footer difference
		const cliPageCount = await getPdfPageCount(cliResult.pdf);
		const browserPageCount = await getPdfPageCount(browserPdfPath);

		expect(browserPageCount).toBe(cliPageCount);

		// This test passes - footer difference is a known limitation
		// to be documented in PRINTING.md
	});
});
