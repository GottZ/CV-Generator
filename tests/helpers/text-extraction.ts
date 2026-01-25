/**
 * PDF text extraction utilities for ATS verification tests.
 *
 * Uses unpdf (a serverless-optimized PDF.js wrapper) to extract text
 * content from PDF files, mimicking how Applicant Tracking Systems
 * parse resume PDFs.
 *
 * Note: This file uses Node.js APIs (not Bun) because Playwright
 * runs tests in Node.js runtime.
 *
 * @example
 * ```ts
 * import { extractTextFromPdf } from './text-extraction';
 *
 * const result = await extractTextFromPdf('/path/to/cv.pdf');
 * expect(result.text).toContain('John Doe');
 * expect(result.totalPages).toBe(2);
 * ```
 */

import { readFile } from 'node:fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Result of extracting text from a PDF file.
 */
export interface TextExtractionResult {
	/** Total number of pages in the PDF */
	totalPages: number;
	/** Full text content merged from all pages */
	text: string;
	/** Text content separated by page for detailed analysis */
	pageTexts: string[];
}

/**
 * Extract text content from a PDF file.
 *
 * This function mimics how ATS (Applicant Tracking Systems) parse
 * PDF resumes. It extracts all readable text from the PDF, making it
 * suitable for verifying that CV content is machine-readable.
 *
 * The extraction handles:
 * - Multi-page PDFs (returns both merged and per-page text)
 * - Unicode text including special characters
 * - Text that may be affected by ligatures (fi, fl, ff sequences)
 *
 * @param pdfPath - Absolute path to the PDF file to extract from
 * @returns Promise resolving to extraction result with text and page count
 * @throws Error if the file cannot be read or is not a valid PDF
 *
 * @example
 * ```ts
 * // Basic usage
 * const result = await extractTextFromPdf('/path/to/cv.pdf');
 * console.log(result.text); // Full text content
 *
 * // Verify specific content
 * expect(result.text).toContain('Senior Software Engineer');
 *
 * // Check per-page content
 * expect(result.pageTexts[0]).toContain('Contact Information');
 * ```
 */
export async function extractTextFromPdf(
	pdfPath: string,
): Promise<TextExtractionResult> {
	// Read PDF file as binary
	const buffer = await readFile(pdfPath);

	// Create PDF document proxy from buffer
	const pdf = await getDocumentProxy(new Uint8Array(buffer));

	// Extract merged text (all pages combined)
	const { totalPages, text } = await extractText(pdf, { mergePages: true });

	// Extract per-page text for detailed analysis
	const perPageResult = await extractText(pdf, { mergePages: false });
	const pageTexts = Array.isArray(perPageResult.text)
		? perPageResult.text
		: [perPageResult.text];

	return {
		totalPages,
		text,
		pageTexts,
	};
}
