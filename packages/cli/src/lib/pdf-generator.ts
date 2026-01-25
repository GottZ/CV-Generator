/**
 * PDF generator module for converting HTML to ATS-optimized PDFs.
 *
 * Uses Puppeteer for rendering with configurable footer, i18n support,
 * and ATS-safe text extraction (ligatures disabled).
 *
 * Implements two-pass generation to detect and fix near-empty last pages:
 * 1. First pass: Generate PDF and analyze page content distribution
 * 2. If last page is <20% filled: inject spacing CSS and regenerate
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
 * Pagination rules are now in _print.css (loaded by render.ts).
 */
const ATS_PRINT_CSS = `
@media print {
	/* Disable ligatures for ATS text extraction (ATS-01) */
	* {
		font-variant-ligatures: none !important;
		font-feature-settings: "liga" 0, "clig" 0 !important;
	}

	/* Force light mode for PDF (prevents dark mode leaking into PDF) */
	:root {
		color-scheme: light !important;
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
 * Implements two-pass generation:
 * 1. First pass generates PDF and analyzes page distribution
 * 2. If last page is sparse (<20% content), injects redistribution CSS
 * 3. Second pass generates final PDF with better content distribution
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

		const pdfOptions = {
			format: 'A4' as const,
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
		};

		// === FIRST PASS: Generate and analyze ===
		const firstPassBuffer = await page.pdf({
			...pdfOptions,
			path: outputPath,
		});

		// Analyze page distribution
		const analysis = await analyzePageDistribution(firstPassBuffer);

		// If last page is sparse and we have multiple pages, do second pass
		if (analysis.isLastPageSparse && analysis.pageCount > 1) {
			// Inject redistribution CSS to spread content more evenly
			await page.addStyleTag({ content: REDISTRIBUTION_CSS });

			// === SECOND PASS: Regenerate with redistribution ===
			const secondPassBuffer = await page.pdf({
				...pdfOptions,
				path: outputPath,
			});

			const finalPageCount = await getPageCount(secondPassBuffer);

			return {
				path: outputPath,
				bytes: secondPassBuffer.length,
				pages: finalPageCount,
			};
		}

		// No redistribution needed, first pass is final
		return {
			path: outputPath,
			bytes: firstPassBuffer.length,
			pages: analysis.pageCount,
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

/**
 * Analyze PDF page content distribution to detect near-empty last page.
 *
 * Uses pdf-lib to compare content stream sizes between pages.
 * A near-empty last page has significantly less content than the average.
 *
 * @param pdfBuffer - PDF file buffer
 * @returns Object with analysis results
 */
async function analyzePageDistribution(pdfBuffer: Uint8Array): Promise<{
	pageCount: number;
	lastPageRatio: number;
	isLastPageSparse: boolean;
}> {
	const pdfDoc = await PDFDocument.load(pdfBuffer);
	const pages = pdfDoc.getPages();
	const pageCount = pages.length;

	if (pageCount <= 1) {
		return { pageCount, lastPageRatio: 1, isLastPageSparse: false };
	}

	// Estimate content by measuring content stream sizes
	// This is a heuristic - larger content streams = more content
	const contentSizes: number[] = [];

	for (const page of pages) {
		// Get the content streams for this page
		const contents = page.node.Contents();
		let size = 0;

		if (contents) {
			// Contents can be a single stream or an array of streams
			const contentArray = Array.isArray(contents) ? contents : [contents];
			for (const content of contentArray) {
				if (content && typeof content.sizeInBytes === 'function') {
					size += content.sizeInBytes();
				}
			}
		}

		contentSizes.push(size);
	}

	// Calculate average of non-last pages
	const nonLastSizes = contentSizes.slice(0, -1);
	const avgSize = nonLastSizes.reduce((a, b) => a + b, 0) / nonLastSizes.length;
	const lastSize = contentSizes[contentSizes.length - 1] ?? 0;

	// Calculate ratio of last page to average
	const lastPageRatio = avgSize > 0 ? lastSize / avgSize : 1;

	// Consider last page sparse if it's less than 20% of average
	// This threshold catches pages with just 1-2 small entries
	const isLastPageSparse = lastPageRatio < 0.2;

	return { pageCount, lastPageRatio, isLastPageSparse };
}

/**
 * CSS to inject for redistributing content when last page is sparse.
 *
 * Adds margin to sections to spread content more evenly, potentially
 * pulling content from the sparse last page onto earlier pages.
 */
const REDISTRIBUTION_CSS = `
@media print {
	/* Add spacing between sections to redistribute content */
	.section {
		margin-bottom: 8mm !important;
	}

	/* Add spacing after entries to spread content */
	.entry {
		margin-bottom: 4mm !important;
	}

	/* Relax break-inside to allow more flexible pagination */
	.certification-entry {
		break-inside: auto !important;
		page-break-inside: auto !important;
	}
}
`;
