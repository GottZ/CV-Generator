/**
 * Visual regression tests for Minimal template output.
 *
 * Tests generate CVs using test fixtures, then capture screenshots
 * of HTML output with print media emulation for visual comparison
 * against baseline snapshots. This validates what the PDF will look like.
 */

import { expect, test } from '@playwright/test';
import {
	cleanTestOutput,
	saveFailureArtifacts,
} from './helpers/artifact-utils';
import { getPdfPageCount } from './helpers/pdf-utils';
import { generateTestCv, type TestCvResult } from './helpers/test-generator';

test.describe('Minimal template visual snapshots', () => {
	// Run tests sequentially to ensure deterministic output generation
	test.describe.configure({ mode: 'serial' });

	let singlePageResult: TestCvResult;
	let multiPageResult: TestCvResult;

	test.beforeAll(async () => {
		// Clean output directory first (CONTEXT.md: cleanup in beforeAll)
		await cleanTestOutput();

		// Generate CVs once, reuse for all tests
		singlePageResult = await generateTestCv({
			template: 'minimal',
			fixture: 'sample-cv',
		});
		multiPageResult = await generateTestCv({
			template: 'minimal',
			fixture: 'multi-page-cv',
		});
	});

	// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring pattern
	test.afterEach(async ({}, testInfo) => {
		// Save artifacts on failure for debugging
		const isSinglePage = testInfo.title.includes('single');
		await saveFailureArtifacts(testInfo, {
			pdf: isSinglePage ? singlePageResult?.pdf : multiPageResult?.pdf,
			html: isSinglePage ? singlePageResult?.html : multiPageResult?.html,
			label: `minimal-${testInfo.title}`,
		});
	});

	test('single page CV matches baseline', async ({ page }) => {
		// Navigate to the HTML file
		await page.goto(`file://${singlePageResult.html}`);

		// Emulate print media for PDF-like rendering
		await page.emulateMedia({ media: 'print' });

		// Wait for page to fully render
		await page.waitForLoadState('networkidle');

		// Set viewport to A4 dimensions at 96 DPI for consistent screenshots
		// A4 = 210mm x 297mm, at 96 DPI = 794 x 1123 pixels
		await page.setViewportSize({ width: 794, height: 1123 });

		// Capture screenshot for visual comparison
		await expect(page).toHaveScreenshot('minimal-single-page.png', {
			fullPage: true,
		});
	});

	test('multi-page CV matches baseline', async ({ page }) => {
		// Navigate to the HTML file
		await page.goto(`file://${multiPageResult.html}`);

		// Emulate print media for PDF-like rendering
		await page.emulateMedia({ media: 'print' });

		// Wait for page to fully render
		await page.waitForLoadState('networkidle');

		// Set viewport to A4 width
		await page.setViewportSize({ width: 794, height: 1123 });

		// Take a full-page screenshot (captures all pages)
		await expect(page).toHaveScreenshot('minimal-multi-page.png', {
			fullPage: true,
		});
	});

	test('page count matches expectations', async () => {
		// Short CV fixture should have 1-2 pages (varies by template density)
		const singlePageCount = await getPdfPageCount(singlePageResult.pdf);
		expect(singlePageCount).toBeGreaterThanOrEqual(1);
		expect(singlePageCount).toBeLessThanOrEqual(2);

		// Multi-page CV fixture should have multiple pages (2+)
		// The exact count varies by template density (294 lines = 3-6 pages typically)
		const multiPageCount = await getPdfPageCount(multiPageResult.pdf);
		expect(multiPageCount).toBeGreaterThanOrEqual(2);
	});
});
