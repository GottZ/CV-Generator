import path from 'node:path';
import { isAllowedFormat, processImage, toDataUri } from './image-processor.ts';

export interface EmbedResult {
	html: string;
	imagesProcessed: number;
	imagesConverted: number;
	warnings: string[];
}

/**
 * Find image references in HTML and replace with base64 data URIs.
 *
 * Per CONTEXT.md:
 * - Images located in /people/[name]/images/ directory
 * - Fail build if image path doesn't exist
 * - Return warning about ATS (caller handles displaying it)
 *
 * Handles both:
 * - Markdown images in raw HTML: ![alt](./images/file.png)
 * - Rendered img tags: <img src="./images/file.png" alt="...">
 */
export async function embedImages(
	html: string,
	imagesDir: string,
): Promise<EmbedResult> {
	const warnings: string[] = [];
	let imagesProcessed = 0;
	let imagesConverted = 0;
	let result = html;

	// Match rendered img tags with ./images/ paths
	// The template renders markdown, so images become <img> tags
	const imgRegex = /<img\s+([^>]*?)src=["']\.\/images\/([^"']+)["']([^>]*)>/gi;
	const matches = [...html.matchAll(imgRegex)];

	if (matches.length === 0) {
		return { html, imagesProcessed: 0, imagesConverted: 0, warnings };
	}

	// ATS warning per ATS-06
	warnings.push('Images detected. ATS systems cannot parse image content.');

	for (const match of matches) {
		const [fullMatch, beforeSrc, filename, afterSrc] = match;
		// filename is always defined because regex group 2 requires at least one char
		const imagePath = path.join(imagesDir, filename ?? '');

		// Validate image exists (fail build per CONTEXT.md)
		const file = Bun.file(imagePath);
		if (!(await file.exists())) {
			throw new Error(`Image not found: ${imagePath}`);
		}

		// Validate format
		if (!isAllowedFormat(imagePath)) {
			const ext = path.extname(filename ?? '').toLowerCase();
			throw new Error(`Unsupported image format: ${ext} for file ${filename}`);
		}

		// Process image
		const processed = await processImage(imagePath);
		const dataUri = toDataUri(processed);

		imagesProcessed++;
		if (processed.wasConverted) {
			imagesConverted++;
		}

		// Replace in HTML
		const newTag = `<img ${beforeSrc}src="${dataUri}"${afterSrc}>`;
		result = result.replace(fullMatch, newTag);
	}

	return {
		html: result,
		imagesProcessed,
		imagesConverted,
		warnings,
	};
}
