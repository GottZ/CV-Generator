/**
 * PDF utilities for test infrastructure.
 *
 * Provides functions to extract metadata and page counts from PDF files
 * for use in test assertions.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Metadata extracted from a PDF file.
 */
export interface PdfMetadata {
	/** Number of pages in the PDF */
	pageCount: number;
	/** PDF title from document info dictionary */
	title: string | undefined;
	/** PDF author from document info dictionary */
	author: string | undefined;
	/** File size in bytes */
	fileSize: number;
}

/**
 * Get the page count from a PDF file.
 *
 * @param pdfPath - Absolute path to the PDF file
 * @returns Promise resolving to the number of pages
 * @throws Error if the file cannot be read or parsed
 *
 * @example
 * ```ts
 * const pageCount = await getPdfPageCount('/path/to/cv.pdf');
 * expect(pageCount).toBeGreaterThanOrEqual(2);
 * ```
 */
export async function getPdfPageCount(pdfPath: string): Promise<number> {
	const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
	const pdfDoc = await PDFDocument.load(pdfBytes);
	return pdfDoc.getPageCount();
}

/**
 * Get metadata from a PDF file.
 *
 * Extracts page count, title, author, and file size from the PDF.
 *
 * @param pdfPath - Absolute path to the PDF file
 * @returns Promise resolving to PdfMetadata object
 * @throws Error if the file cannot be read or parsed
 *
 * @example
 * ```ts
 * const metadata = await getPdfMetadata('/path/to/cv.pdf');
 * expect(metadata.title).toBe('John Doe - CV');
 * expect(metadata.pageCount).toBe(2);
 * ```
 */
export async function getPdfMetadata(pdfPath: string): Promise<PdfMetadata> {
	const file = Bun.file(pdfPath);
	const fileSize = file.size;
	const pdfBytes = await file.arrayBuffer();
	const pdfDoc = await PDFDocument.load(pdfBytes);

	return {
		pageCount: pdfDoc.getPageCount(),
		title: pdfDoc.getTitle(),
		author: pdfDoc.getAuthor(),
		fileSize,
	};
}

/**
 * Get the file size of a PDF in bytes.
 *
 * @param pdfPath - Absolute path to the PDF file
 * @returns Promise resolving to file size in bytes
 * @throws Error if the file cannot be accessed
 *
 * @example
 * ```ts
 * const size = await getPdfFileSize('/path/to/cv.pdf');
 * expect(size).toBeLessThan(1_000_000); // Less than 1MB
 * ```
 */
export async function getPdfFileSize(pdfPath: string): Promise<number> {
	const file = Bun.file(pdfPath);
	return file.size;
}
