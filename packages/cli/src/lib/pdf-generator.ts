/**
 * PDF generator module for converting HTML to ATS-optimized PDFs.
 *
 * Uses Puppeteer for rendering with configurable footer, i18n support,
 * and ATS-safe text extraction (ligatures disabled).
 */
import { PDFDocument } from 'pdf-lib';
import { getBrowser } from './browser-manager';

/**
 * Footer configuration for PDF output.
 * Satisfies OUT-07 requirement for configurable page footer.
 */
export interface FooterConfig {
	/** Whether to show footer at all (default: true) */
	enabled: boolean;
	/** Whether to include candidate name in footer (default: true) */
	showName: boolean;
	/** Whether to include page numbers (default: true) */
	showPageNumbers: boolean;
	/** Custom footer HTML template (overrides above flags if provided) */
	template?: string;
}

/**
 * Options for PDF generation.
 */
export interface PdfOptions {
	/** Absolute path to the HTML file to convert */
	htmlPath: string;
	/** Absolute path for the output PDF file */
	outputPath: string;
	/** Candidate name for footer display */
	name: string;
	/** Locale for i18n page numbering (en, de) */
	locale: string;
	/** Footer configuration (OUT-07 configurable footer) */
	footer?: FooterConfig;
	/** Page margins in CSS units (default: 20mm) */
	margins?: {
		top?: string;
		bottom?: string;
		left?: string;
		right?: string;
	};
	/** PDF generation timeout in milliseconds (default: 30000) */
	timeout?: number;
}

/**
 * Result of PDF generation.
 */
export interface PdfResult {
	/** Absolute path to the generated PDF file */
	path: string;
	/** Size of the PDF in bytes */
	bytes: number;
	/** Number of pages in the PDF */
	pages: number;
}

/**
 * ATS-safe print CSS to inject before PDF generation.
 * Disables ligatures to ensure text extraction works correctly.
 * Provides improved pagination rules to prevent empty pages and excessive gaps.
 */
const ATS_PRINT_CSS = `
@media print {
	/* Disable ligatures for ATS text extraction (ATS-01) */
	* {
		font-variant-ligatures: none !important;
		font-feature-settings: "liga" 0, "clig" 0 !important;
	}

	/* Force light mode for PDF */
	:root {
		color-scheme: light !important;
	}

	/* Improved pagination - sections can span pages */
	.section {
		break-inside: auto;
		page-break-inside: auto;
		orphans: 3;
		widows: 3;
	}

	/* Section headers stay with content */
	.section h2 {
		break-after: avoid;
		page-break-after: avoid;
	}

	/* Entries stay intact when reasonable */
	.entry {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	/* Bullet items stay intact */
	.bullet-item {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	/* Contact stays together */
	.contact {
		break-inside: avoid;
		page-break-inside: avoid;
		break-after: avoid;
	}

	/* Remove interactive elements */
	.theme-toggle {
		display: none !important;
	}
}
`;

/**
 * Build i18n page format string.
 */
function getPageFormat(locale: string): string {
	if (locale === 'de') {
		return 'Seite <span class="pageNumber"></span> von <span class="totalPages"></span>';
	}
	return 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>';
}

/**
 * Build footer HTML template from configuration.
 */
function buildFooterTemplate(
	name: string,
	locale: string,
	config: FooterConfig,
): string {
	// If custom template provided, use it directly
	if (config.template) {
		return config.template;
	}

	// If footer disabled, return empty
	if (!config.enabled) {
		return '<span></span>';
	}

	// Build parts based on flags
	const parts: string[] = [];

	if (config.showName) {
		parts.push(`<span>${name}</span>`);
	}

	if (config.showPageNumbers) {
		parts.push(`<span>${getPageFormat(locale)}</span>`);
	}

	// If no parts, return empty
	if (parts.length === 0) {
		return '<span></span>';
	}

	// Build footer with flex layout for spacing
	const justifyContent = parts.length === 1 ? 'center' : 'space-between';

	return `
<div style="
	width: 100%;
	font-size: 9pt;
	font-family: Arial, Helvetica, sans-serif;
	color: #666666;
	padding: 0 25mm;
	display: flex;
	justify-content: ${justifyContent};
">
	${parts.join('\n\t')}
</div>
`;
}

/**
 * Default footer configuration.
 */
const DEFAULT_FOOTER: FooterConfig = {
	enabled: true,
	showName: true,
	showPageNumbers: true,
};

/**
 * Default margins (standard 20mm for PDF with footer space).
 */
const DEFAULT_MARGINS = {
	top: '20mm',
	bottom: '20mm',
	left: '25mm',
	right: '25mm',
};

/**
 * Generate a PDF from an HTML file.
 *
 * Uses Puppeteer to render the HTML with ATS-optimized settings:
 * - Ligatures disabled for proper text extraction
 * - Configurable footer with i18n page numbers
 * - Print background enabled for colors
 * - Tagged PDF for accessibility
 *
 * @param options - PDF generation options
 * @returns Promise<PdfResult> - Generated PDF info
 */
export async function generatePdf(options: PdfOptions): Promise<PdfResult> {
	const {
		htmlPath,
		outputPath,
		name,
		locale,
		footer = DEFAULT_FOOTER,
		margins = DEFAULT_MARGINS,
		timeout = 30000,
	} = options;

	const browser = await getBrowser();
	const page = await browser.newPage();

	try {
		// Navigate to HTML file
		await page.goto(`file://${htmlPath}`, {
			waitUntil: 'networkidle0',
			timeout,
		});

		// Wait for fonts to load
		await page.evaluateHandle('document.fonts.ready');

		// Inject ATS-safe print CSS
		await page.addStyleTag({ content: ATS_PRINT_CSS });

		// Build footer template from config
		const footerTemplate = buildFooterTemplate(name, locale, footer);
		const displayHeaderFooter = footer.enabled !== false;

		// Generate PDF with ATS-optimized settings
		const pdfBuffer = await page.pdf({
			path: outputPath,
			format: 'A4',
			printBackground: true,
			preferCSSPageSize: true,
			displayHeaderFooter,
			headerTemplate: '<span></span>', // Empty header
			footerTemplate,
			margin: {
				top: margins.top ?? DEFAULT_MARGINS.top,
				bottom: margins.bottom ?? DEFAULT_MARGINS.bottom,
				left: margins.left ?? DEFAULT_MARGINS.left,
				right: margins.right ?? DEFAULT_MARGINS.right,
			},
			tagged: true, // Accessibility - generates tagged PDF
			timeout,
		});

		// Get actual page count using pdf-lib
		const pageCount = await getPageCount(pdfBuffer);

		return {
			path: outputPath,
			bytes: pdfBuffer.length,
			pages: pageCount,
		};
	} finally {
		// Always close page to prevent memory leaks (RESEARCH.md Pitfall 5)
		await page.close();
	}
}

/**
 * Get actual page count from a PDF buffer using pdf-lib.
 */
async function getPageCount(pdfBuffer: Uint8Array): Promise<number> {
	const pdfDoc = await PDFDocument.load(pdfBuffer);
	return pdfDoc.getPageCount();
}
