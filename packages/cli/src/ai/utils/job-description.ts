/**
 * Load job descriptions from file, URL, or stdin.
 * Source: RESEARCH.md Pattern 5 and CONTEXT.md Section 4
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withRetry } from './retry.ts';

/**
 * Result of loading a job description.
 */
export interface JobDescriptionSource {
	/** Source type: file, url, or stdin */
	type: 'file' | 'url' | 'stdin';
	/** The job description content */
	content: string;
	/** Metadata about the source */
	metadata?: {
		/** Original filename if loaded from file */
		filename?: string;
		/** Original URL if fetched from web */
		url?: string;
		/** ISO timestamp when URL was fetched */
		fetchedAt?: string;
	};
}

/**
 * Options for loading job descriptions.
 */
export interface LoadJobOptions {
	/** Maximum redirects to follow for URLs (default: 5) */
	followRedirects?: number;
}

/**
 * Load a job description from a file path, URL, or stdin.
 *
 * Source detection:
 * - No source or '-' = read from stdin
 * - Starts with http:// or https:// = fetch from URL
 * - Otherwise = read as file path (supports .txt, .md, .pdf)
 *
 * @param source - File path, URL, or undefined/'-' for stdin
 * @param options - Loading options
 * @returns Job description content and metadata
 * @throws Error if source cannot be read or is invalid
 *
 * @example
 * ```typescript
 * // From file
 * const job = await loadJobDescription('job.txt');
 *
 * // From URL
 * const job = await loadJobDescription('https://example.com/job');
 *
 * // From stdin
 * const job = await loadJobDescription();
 * ```
 */
export async function loadJobDescription(
	source: string | undefined,
	options: LoadJobOptions = {},
): Promise<JobDescriptionSource> {
	// Stdin (piped input or explicit '-')
	if (!source || source === '-') {
		const content = await readStdin();
		if (content.length < 100) {
			console.warn(
				'Warning: Job description seems short (<100 characters). ' +
					'Consider providing more details for better results.',
			);
		}
		return { type: 'stdin', content };
	}

	// URL
	if (source.startsWith('http://') || source.startsWith('https://')) {
		return await fetchJobFromUrl(source, options.followRedirects ?? 5);
	}

	// File (txt, md, pdf)
	const ext = path.extname(source).toLowerCase();

	if (ext === '.pdf') {
		const content = await extractPdfText(source);
		if (!content) {
			throw new Error(
				`Could not extract text from PDF: ${source}\n` +
					'The PDF may be scanned or have an unsupported format.\n\n' +
					'To proceed:\n' +
					'1. Open the PDF and copy the text content\n' +
					'2. Save to a text file: job.txt\n' +
					'3. Run the command with the text file instead',
			);
		}
		return { type: 'file', content, metadata: { filename: source } };
	}

	// Plain text or markdown
	try {
		const content = await readFile(source, 'utf-8');
		return { type: 'file', content, metadata: { filename: source } };
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			throw new Error(
				`Job description file not found: ${source}\n\n` +
					'Check that the file path is correct.',
			);
		}
		throw error;
	}
}

/**
 * Read all input from stdin until EOF.
 *
 * @returns Promise resolving to stdin content
 */
async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];

	// Check if stdin is a TTY (interactive)
	if (process.stdin.isTTY) {
		console.log('Paste job description (press Ctrl+D when done):');
	}

	for await (const chunk of process.stdin) {
		chunks.push(Buffer.from(chunk));
	}

	return Buffer.concat(chunks).toString('utf-8').trim();
}

/**
 * Fetch job description from a URL with redirect handling.
 *
 * @param url - URL to fetch
 * @param maxRedirects - Maximum number of redirects to follow
 * @returns Job description content and metadata
 */
async function fetchJobFromUrl(
	url: string,
	maxRedirects: number,
): Promise<JobDescriptionSource> {
	let currentUrl = url;
	let redirectCount = 0;

	while (redirectCount < maxRedirects) {
		const response = await withRetry(
			async () => {
				return fetch(currentUrl, {
					headers: {
						'User-Agent':
							'cvgen/1.0 (job description fetcher; https://github.com/gottz/cvgen)',
						Accept: 'text/html,text/plain,application/xhtml+xml',
					},
					redirect: 'manual',
				});
			},
			{ maxAttempts: 3, baseDelayMs: 1000 },
		);

		// Handle redirects manually to count them
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');
			if (location) {
				currentUrl = new URL(location, currentUrl).toString();
				redirectCount++;
				continue;
			}
		}

		// Check for errors
		if (!response.ok) {
			throw new Error(
				`Failed to fetch job posting from ${url}\n` +
					`Status: ${response.status} ${response.statusText}\n\n` +
					'Some sites block automated requests.\n' +
					'To proceed:\n' +
					'1. Open the URL in your browser\n' +
					'2. Copy the job description text\n' +
					'3. Save to a file: job.txt\n' +
					`4. Run: cvgen ai <command> --job job.txt`,
			);
		}

		const html = await response.text();
		const content = extractTextFromHtml(html);

		// Check for blocking indicators
		if (
			content.length < 50 ||
			content.toLowerCase().includes('captcha') ||
			content.toLowerCase().includes('access denied') ||
			content.toLowerCase().includes('please verify') ||
			content.toLowerCase().includes('robot')
		) {
			throw new Error(
				`Could not fetch job posting from ${url}\n` +
					'The site appears to be blocking automated requests.\n\n' +
					'To proceed:\n' +
					'1. Open the URL in your browser\n' +
					'2. Copy the job description text\n' +
					'3. Save to a file: job.txt\n' +
					`4. Run: cvgen ai <command> --job job.txt`,
			);
		}

		return {
			type: 'url',
			content,
			metadata: {
				url: currentUrl,
				fetchedAt: new Date().toISOString(),
			},
		};
	}

	throw new Error(
		`Too many redirects (max: ${maxRedirects}) when fetching ${url}`,
	);
}

/**
 * Extract text from a PDF file using unpdf.
 *
 * @param filePath - Path to the PDF file
 * @returns Extracted text or null if extraction fails
 */
async function extractPdfText(filePath: string): Promise<string | null> {
	try {
		// Dynamic import to avoid bundling issues
		const { getDocumentProxy, extractText } = await import('unpdf');
		const buffer = await readFile(filePath);
		const pdf = await getDocumentProxy(new Uint8Array(buffer));
		const { text } = await extractText(pdf, { mergePages: true });
		return text || null;
	} catch {
		// PDF extraction failed - return null to trigger helpful error
		return null;
	}
}

/**
 * Extract readable text from HTML content.
 *
 * Removes script tags, style tags, HTML comments, and strips HTML entities.
 * Normalizes whitespace for readability.
 *
 * @param html - Raw HTML content
 * @returns Plain text content
 */
function extractTextFromHtml(html: string): string {
	let text = html;

	// Remove script and style tags with content
	text = text.replace(
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		'',
	);
	text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

	// Remove HTML comments
	text = text.replace(/<!--[\s\S]*?-->/g, '');

	// Remove all HTML tags
	text = text.replace(/<[^>]+>/g, ' ');

	// Decode common HTML entities
	text = text
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&#(\d+);/gi, (_, code) =>
			String.fromCharCode(Number.parseInt(code, 10)),
		)
		.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
			String.fromCharCode(Number.parseInt(code, 16)),
		);

	// Normalize whitespace
	text = text.replace(/\s+/g, ' ').trim();

	return text;
}
