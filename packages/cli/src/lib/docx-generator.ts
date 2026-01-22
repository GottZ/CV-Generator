/**
 * DOCX generator module for creating ATS-optimized Word documents.
 *
 * Uses the docx library to build documents programmatically from CVData.
 * Provides native Word field codes for page numbers and built-in styles
 * for Navigation Pane support.
 */

import type { CVData } from '@gottz/cv-core';
import {
	AlignmentType,
	Document,
	Footer,
	Header,
	Packer,
	PageNumber,
	Paragraph,
	TextRun,
} from 'docx';
import { buildDocumentContent } from './docx-sections.ts';

/**
 * Options for DOCX generation.
 */
export interface DocxOptions {
	/** CV data to render */
	cv: CVData;
	/** Locale for i18n (en, de) */
	locale: string;
	/** Absolute path for output .docx file */
	outputPath: string;
	/** Optional directory containing profile images */
	imagesDir?: string;
}

/**
 * Result of DOCX generation.
 */
export interface DocxResult {
	/** Absolute path to the generated DOCX file */
	path: string;
	/** Size of the DOCX in bytes */
	bytes: number;
}

/**
 * Page margin constants in TWIPs (1 inch = 1440 TWIPs, 1mm ~ 57 TWIPs).
 * Matching PDF margins: ~20mm top/bottom, ~25mm left/right.
 */
const PAGE_MARGINS = {
	top: 1134, // 20mm in TWIPs
	bottom: 1134, // 20mm in TWIPs
	left: 1418, // 25mm in TWIPs
	right: 1418, // 25mm in TWIPs
};

/**
 * Footer font size in half-points (9pt = 18 half-points).
 */
const FOOTER_FONT_SIZE = 18;

/**
 * Footer text color (gray).
 */
const FOOTER_COLOR = '666666';

/**
 * Get i18n page format labels.
 */
function getPageLabels(locale: string): { page: string; of: string } {
	if (locale === 'de') {
		return { page: 'Seite', of: 'von' };
	}
	return { page: 'Page', of: 'of' };
}

/**
 * Create footer with "Name - Page X of Y" using native Word field codes.
 *
 * Uses PageNumber.CURRENT and PageNumber.TOTAL_PAGES for proper
 * field codes that update automatically in Word.
 */
function createFooter(name: string, locale: string): Footer {
	const { page, of } = getPageLabels(locale);

	return new Footer({
		children: [
			new Paragraph({
				alignment: AlignmentType.CENTER,
				children: [
					new TextRun({
						text: `${name} - ${page} `,
						size: FOOTER_FONT_SIZE,
						color: FOOTER_COLOR,
						font: 'Arial',
					}),
					new TextRun({
						children: [PageNumber.CURRENT],
						size: FOOTER_FONT_SIZE,
						color: FOOTER_COLOR,
						font: 'Arial',
					}),
					new TextRun({
						text: ` ${of} `,
						size: FOOTER_FONT_SIZE,
						color: FOOTER_COLOR,
						font: 'Arial',
					}),
					new TextRun({
						children: [PageNumber.TOTAL_PAGES],
						size: FOOTER_FONT_SIZE,
						color: FOOTER_COLOR,
						font: 'Arial',
					}),
				],
			}),
		],
	});
}

/**
 * Generate a DOCX file from CV data.
 *
 * Creates a Word document with:
 * - Document properties (metadata): creator, title, subject, description
 * - Single section with standard page margins
 * - i18n footer with "Name - Page X of Y" using native Word field codes
 * - Content using built-in Word styles (Heading 1, etc.)
 *
 * @param options - DOCX generation options
 * @returns Promise<DocxResult> - Generated DOCX info
 */
export async function generateDocx(options: DocxOptions): Promise<DocxResult> {
	const { cv, locale, outputPath, imagesDir } = options;
	const name = cv.contact.name;

	// Create footer with native Word field codes
	const footer = createFooter(name, locale);

	// Build document content from CV data with section builders
	const children = await buildDocumentContent(cv, locale, imagesDir);

	// Create document with metadata properties
	const doc = new Document({
		// Document properties (metadata) per CONTEXT.md
		creator: 'CV Generator',
		title: `${name} - CV`,
		subject: 'Curriculum Vitae',
		description: `Curriculum Vitae for ${name}`,

		sections: [
			{
				properties: {
					page: {
						margin: PAGE_MARGINS,
					},
				},
				headers: {
					default: new Header({ children: [] }), // Empty header
				},
				footers: {
					default: footer,
				},
				children,
			},
		],
	});

	// Generate buffer using Packer.toBuffer() (NOT toBlob - browser-only)
	const buffer = Buffer.from(await Packer.toBuffer(doc));

	// Write file using Bun.write()
	await Bun.write(outputPath, buffer);

	return {
		path: outputPath,
		bytes: buffer.length,
	};
}
