/**
 * Visual regression tests for Minimal template PDF output.
 *
 * Tests generate CVs using test fixtures, then capture screenshots
 * for visual comparison against baseline snapshots.
 */

import { expect, test } from '@playwright/test';
import { getPdfPageCount } from './helpers/pdf-utils';
import {
	cleanupTestOutput,
	generateTestCv,
	type TestCvResult,
} from './helpers/test-generator';

// Run tests sequentially to ensure deterministic PDF generation
test.describe.configure({ mode: 'serial' });

test.describe('Minimal template PDF snapshots', () => {
	let singlePageResult: TestCvResult;
	let multiPageResult: TestCvResult;

	test.beforeAll(async () => {
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

	test.afterAll(async () => {
		// Clean up generated files
		await cleanupTestOutput();
	});

	test('single page CV matches baseline', async ({ page }) => {
		// Navigate to the PDF file
		await page.goto(`file://${singlePageResult.pdf}`);

		// Wait for PDF to fully load and render
		await page.waitForTimeout(1000);

		// Capture screenshot for visual comparison
		await expect(page).toHaveScreenshot('minimal-single-page.png');
	});

	test('multi-page CV matches baseline', async ({ page }) => {
		// Get the page count to know how many screenshots to capture
		const pageCount = await getPdfPageCount(multiPageResult.pdf);

		// Navigate to the PDF file
		await page.goto(`file://${multiPageResult.pdf}`);

		// Wait for PDF to fully load
		await page.waitForTimeout(1000);

		// Screenshot each page
		for (let i = 1; i <= pageCount; i++) {
			await expect(page).toHaveScreenshot(`minimal-page-${i}.png`);

			// Navigate to next page if not the last one
			if (i < pageCount) {
				await page.keyboard.press('PageDown');
				await page.waitForTimeout(500);
			}
		}
	});

	test('page count matches expectations', async () => {
		// Single page CV should have exactly 1 page
		const singlePageCount = await getPdfPageCount(singlePageResult.pdf);
		expect(singlePageCount).toBe(1);

		// Multi-page CV should have 2-3 pages
		const multiPageCount = await getPdfPageCount(multiPageResult.pdf);
		expect(multiPageCount).toBeGreaterThanOrEqual(2);
		expect(multiPageCount).toBeLessThanOrEqual(3);
	});
});
