/**
 * Print parity comparison utilities.
 *
 * Provides functions to compare CLI-generated PDFs (Puppeteer) against
 * browser-generated PDFs (Playwright) for print parity verification.
 *
 * Note: This file uses Node.js APIs (not Bun) because Playwright
 * runs tests in Node.js runtime.
 */

import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

/**
 * Result of a parity comparison between two PDFs.
 */
export interface ParityResult {
	/** Whether the PDFs match (page counts equal) */
	match: boolean;
	/** Page count of CLI-generated PDF */
	cliPageCount: number;
	/** Page count of browser-generated PDF */
	browserPageCount: number;
	/** CLI PDF metadata */
	cliMetadata: {
		title: string | undefined;
		author: string | undefined;
	};
	/** Browser PDF metadata */
	browserMetadata: {
		title: string | undefined;
		author: string | undefined;
	};
	/** List of issues found during comparison */
	issues: string[];
}

/**
 * Compare two PDFs for print parity.
 *
 * Compares page counts (critical) and metadata (informational).
 * Page count mismatch indicates print parity failure.
 *
 * @param cliPdfPath - Path to CLI-generated PDF (Puppeteer)
 * @param browserPdfPath - Path to browser-generated PDF (Playwright)
 * @returns Promise resolving to comparison result
 *
 * @example
 * ```ts
 * const result = await compareForParity('/path/to/cli.pdf', '/path/to/browser.pdf');
 * expect(result.match).toBe(true);
 * ```
 */
export async function compareForParity(
	cliPdfPath: string,
	browserPdfPath: string,
): Promise<ParityResult> {
	const cliBytes = await readFile(cliPdfPath);
	const browserBytes = await readFile(browserPdfPath);

	const cliPdf = await PDFDocument.load(cliBytes);
	const browserPdf = await PDFDocument.load(browserBytes);

	const issues: string[] = [];

	// Page count comparison (critical for PRINT-01)
	const cliPageCount = cliPdf.getPageCount();
	const browserPageCount = browserPdf.getPageCount();

	if (cliPageCount !== browserPageCount) {
		issues.push(
			`Page count mismatch: CLI=${cliPageCount}, Browser=${browserPageCount}`,
		);
	}

	// Metadata extraction (informational, not blocking)
	const cliMetadata = {
		title: cliPdf.getTitle(),
		author: cliPdf.getAuthor(),
	};

	const browserMetadata = {
		title: browserPdf.getTitle(),
		author: browserPdf.getAuthor(),
	};

	// Note: Browser print may not preserve metadata - this is a known limitation
	// Do not add to issues as it's expected behavior

	return {
		match: issues.length === 0,
		cliPageCount,
		browserPageCount,
		cliMetadata,
		browserMetadata,
		issues,
	};
}

/**
 * Browser print PDF options matching Puppeteer settings.
 *
 * These settings align with pdf-generator.ts to ensure maximum parity.
 * Key differences:
 * - No footerTemplate (browser print doesn't inject footer)
 * - preferCSSPageSize: true (relies on @page rules in _print.css)
 */
export const BROWSER_PDF_OPTIONS = {
	format: 'A4' as const,
	printBackground: true,
	preferCSSPageSize: true,
	margin: {
		top: '20mm',
		bottom: '20mm',
		left: '25mm',
		right: '25mm',
	},
};
