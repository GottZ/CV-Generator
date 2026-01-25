/**
 * Structural tests for PDF quality assurance.
 *
 * Tests verify PDF page count, metadata presence, and file size sanity
 * across all templates and fixtures. These tests ensure generated PDFs
 * meet structural quality requirements.
 *
 * Requirements covered:
 * - TEST-03: Page count verification
 * - TEST-04: PDF metadata presence
 * - TEST-05: File size sanity checks
 */

import { expect, test } from '@playwright/test';
import { getPdfMetadata, type PdfMetadata } from './helpers/pdf-utils';
import {
	cleanupTestOutput,
	generateTestCv,
	type TestCvResult,
} from './helpers/test-generator';

test.describe('PDF Structural Tests', () => {
	// Run tests sequentially to ensure deterministic output generation
	test.describe.configure({ mode: 'serial' });

	// Store generated results for all template/fixture combinations
	const results: Record<string, TestCvResult> = {};
	const metadata: Record<string, PdfMetadata> = {};

	test.beforeAll(async () => {
		// Generate CVs for all template/fixture combinations
		results.modernSample = await generateTestCv({
			template: 'modern',
			fixture: 'sample-cv',
		});
		results.modernMulti = await generateTestCv({
			template: 'modern',
			fixture: 'multi-page-cv',
		});
		results.minimalSample = await generateTestCv({
			template: 'minimal',
			fixture: 'sample-cv',
		});
		results.classicSample = await generateTestCv({
			template: 'classic',
			fixture: 'sample-cv',
		});

		// Pre-fetch metadata for all generated PDFs
		metadata.modernSample = await getPdfMetadata(results.modernSample.pdf);
		metadata.modernMulti = await getPdfMetadata(results.modernMulti.pdf);
		metadata.minimalSample = await getPdfMetadata(results.minimalSample.pdf);
		metadata.classicSample = await getPdfMetadata(results.classicSample.pdf);
	});

	test.afterAll(async () => {
		await cleanupTestOutput();
	});

	// TEST-03: Page Count Expectations
	test.describe('Page Count Expectations', () => {
		test('sample CV produces 1-2 pages (modern template)', () => {
			expect(metadata.modernSample.pageCount).toBeGreaterThanOrEqual(1);
			expect(metadata.modernSample.pageCount).toBeLessThanOrEqual(2);
		});

		test('sample CV produces 1-2 pages (minimal template)', () => {
			expect(metadata.minimalSample.pageCount).toBeGreaterThanOrEqual(1);
			expect(metadata.minimalSample.pageCount).toBeLessThanOrEqual(2);
		});

		test('sample CV produces 1-2 pages (classic template)', () => {
			expect(metadata.classicSample.pageCount).toBeGreaterThanOrEqual(1);
			expect(metadata.classicSample.pageCount).toBeLessThanOrEqual(2);
		});

		test('multi-page CV produces 2+ pages', () => {
			// Long CV must produce multiple pages (validates pagination CSS works)
			expect(metadata.modernMulti.pageCount).toBeGreaterThanOrEqual(2);
		});

		test('page count is reasonable upper bound', () => {
			// Sanity check: CV should never be 10+ pages
			expect(metadata.modernSample.pageCount).toBeLessThanOrEqual(10);
			expect(metadata.modernMulti.pageCount).toBeLessThanOrEqual(10);
			expect(metadata.minimalSample.pageCount).toBeLessThanOrEqual(10);
			expect(metadata.classicSample.pageCount).toBeLessThanOrEqual(10);
		});
	});

	// TEST-04: PDF Metadata Presence
	test.describe('PDF Metadata', () => {
		test('PDF has title metadata', () => {
			// Title should be defined and non-empty
			expect(metadata.modernSample.title).toBeDefined();
			expect(typeof metadata.modernSample.title).toBe('string');
			expect(metadata.modernSample.title?.length).toBeGreaterThan(0);
		});

		test('PDF has author metadata', () => {
			// Author should be defined and non-empty
			expect(metadata.modernSample.author).toBeDefined();
			expect(typeof metadata.modernSample.author).toBe('string');
			expect(metadata.modernSample.author?.length).toBeGreaterThan(0);
		});
	});

	// TEST-05: File Size Sanity
	test.describe('File Size Sanity', () => {
		test('PDF is not empty (> 10KB)', () => {
			// Empty or near-empty PDFs indicate generation failure
			expect(metadata.modernSample.fileSize).toBeGreaterThan(10_000);
			expect(metadata.modernMulti.fileSize).toBeGreaterThan(10_000);
			expect(metadata.minimalSample.fileSize).toBeGreaterThan(10_000);
			expect(metadata.classicSample.fileSize).toBeGreaterThan(10_000);
		});

		test('PDF is not bloated (< 5MB)', () => {
			// Bloated PDFs indicate embedded resources issues
			expect(metadata.modernSample.fileSize).toBeLessThan(5_000_000);
			expect(metadata.modernMulti.fileSize).toBeLessThan(5_000_000);
			expect(metadata.minimalSample.fileSize).toBeLessThan(5_000_000);
			expect(metadata.classicSample.fileSize).toBeLessThan(5_000_000);
		});

		test('multi-page PDF is reasonably larger', () => {
			// Multi-page should be larger (more content)
			expect(metadata.modernMulti.fileSize).toBeGreaterThan(
				metadata.modernSample.fileSize,
			);
			// But not 10x larger (would indicate problem)
			expect(metadata.modernMulti.fileSize).toBeLessThan(
				metadata.modernSample.fileSize * 10,
			);
		});
	});

	// Summary validation test
	test('all templates produce valid PDFs', () => {
		// Loop through all generated results and verify each has valid metadata
		const allMetadata = [
			{ name: 'modern-sample', data: metadata.modernSample },
			{ name: 'modern-multi', data: metadata.modernMulti },
			{ name: 'minimal-sample', data: metadata.minimalSample },
			{ name: 'classic-sample', data: metadata.classicSample },
		];

		for (const { name, data } of allMetadata) {
			// Every PDF should have valid metadata
			expect(data.pageCount, `${name} pageCount`).toBeGreaterThan(0);
			expect(data.fileSize, `${name} fileSize`).toBeGreaterThan(0);
		}
	});
});
