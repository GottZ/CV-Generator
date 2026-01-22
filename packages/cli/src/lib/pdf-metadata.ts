/**
 * PDF metadata module for setting document properties.
 *
 * Uses pdf-lib to set title, author, subject, creator, and dates
 * for better organization and search indexing.
 */
import { PDFDocument } from 'pdf-lib';

/**
 * Metadata properties for PDF documents.
 * Satisfies OUT-06 requirement for PDF document properties.
 */
export interface PdfMetadata {
	/** Document title (e.g., "John Doe - CV") */
	title: string;
	/** Author name (the person's name) */
	author: string;
	/** Subject description (default: "Curriculum Vitae") */
	subject?: string;
	/** Creator application (default: "CV Generator") */
	creator?: string;
	/** Keywords for search indexing */
	keywords?: string[];
}

/**
 * Set metadata on a PDF buffer and return the modified buffer.
 *
 * Sets the following properties:
 * - Title: Document title for display in PDF readers
 * - Author: Person's name for attribution
 * - Subject: Default "Curriculum Vitae"
 * - Creator: Default "CV Generator"
 * - Keywords: Optional search keywords
 * - Creation/Modification dates: Current timestamp
 *
 * @param pdfBuffer - Input PDF as Buffer
 * @param metadata - Metadata properties to set
 * @returns Promise<Buffer> - Modified PDF with metadata
 */
export async function setPdfMetadata(
	pdfBuffer: Buffer,
	metadata: PdfMetadata,
): Promise<Buffer> {
	const pdfDoc = await PDFDocument.load(pdfBuffer);

	// Set required metadata
	pdfDoc.setTitle(metadata.title);
	pdfDoc.setAuthor(metadata.author);

	// Set optional metadata with defaults
	pdfDoc.setSubject(metadata.subject ?? 'Curriculum Vitae');
	pdfDoc.setCreator(metadata.creator ?? 'CV Generator');

	// Set keywords if provided
	if (metadata.keywords && metadata.keywords.length > 0) {
		pdfDoc.setKeywords(metadata.keywords);
	}

	// Set timestamps
	const now = new Date();
	pdfDoc.setCreationDate(now);
	pdfDoc.setModificationDate(now);

	// Save and return as Buffer
	return Buffer.from(await pdfDoc.save());
}
