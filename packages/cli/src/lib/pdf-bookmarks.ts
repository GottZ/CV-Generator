/**
 * PDF bookmark (outline) module for section navigation.
 *
 * Uses @lillallol/outline-pdf to add section bookmarks to PDFs,
 * enabling quick navigation to Experience, Education, Skills sections.
 */
import { outlinePdfFactory } from '@lillallol/outline-pdf';
import * as pdfLib from 'pdf-lib';

// Initialize outline-pdf with pdf-lib
const outlinePdf = outlinePdfFactory(pdfLib);

/**
 * Section information for bookmark generation.
 */
export interface SectionInfo {
	/** Section header text (e.g., "Experience", "Berufserfahrung") */
	title: string;
	/** 1-indexed page number where section starts */
	page: number;
}

/**
 * Add section bookmarks to a PDF.
 *
 * Creates an outline/bookmark panel in PDF readers for quick
 * navigation to CV sections.
 *
 * @param pdfBuffer - Raw PDF buffer to modify
 * @param sections - Array of sections with titles and page numbers
 * @returns Promise<Buffer> - Modified PDF buffer with bookmarks
 */
export async function addPdfBookmarks(
	pdfBuffer: Buffer,
	sections: SectionInfo[],
): Promise<Buffer> {
	// If no sections, return original buffer unchanged
	if (sections.length === 0) {
		return pdfBuffer;
	}

	// Build outline string in format: "pageNum||title"
	// One line per bookmark entry
	const outlineString = sections.map((s) => `${s.page}||${s.title}`).join('\n');

	// Apply outline to PDF
	const pdfDoc = await outlinePdf({
		pdf: pdfBuffer,
		outline: outlineString,
	});

	// Save and return as Buffer
	const pdfBytes = await pdfDoc.save();
	return Buffer.from(pdfBytes);
}

/**
 * Get default section bookmarks for a locale.
 *
 * Returns standard CV sections with localized titles.
 * All sections default to page 1 (typical for 1-2 page CVs).
 *
 * @param locale - Locale code (en, de)
 * @returns SectionInfo[] - Default sections for the locale
 */
export function getDefaultSections(locale: string): SectionInfo[] {
	if (locale === 'de') {
		return [
			{ title: 'Berufserfahrung', page: 1 },
			{ title: 'Ausbildung', page: 1 },
			{ title: 'Kenntnisse', page: 1 },
		];
	}
	return [
		{ title: 'Experience', page: 1 },
		{ title: 'Education', page: 1 },
		{ title: 'Skills', page: 1 },
	];
}
