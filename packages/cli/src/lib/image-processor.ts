import path from 'node:path';
import sharp from 'sharp';

export interface ProcessedImage {
	base64: string;
	mimeType: string;
	originalFormat: string;
	wasConverted: boolean;
}

const ALLOWED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/**
 * Process an image for HTML embedding.
 * Per CONTEXT.md:
 * - Photos (JPEG source) converted to WebP for smaller size
 * - Graphics (PNG) kept as-is
 * - Fail on invalid format
 */
export async function processImage(imagePath: string): Promise<ProcessedImage> {
	// Validate format per CONTEXT.md
	const ext = path.extname(imagePath).toLowerCase();
	if (!ALLOWED_FORMATS.includes(ext)) {
		throw new Error(
			`Unsupported image format: ${ext}. Allowed: ${ALLOWED_FORMATS.join(', ')}`,
		);
	}

	const file = Bun.file(imagePath);
	const buffer = Buffer.from(await file.arrayBuffer());
	const metadata = await sharp(buffer).metadata();
	const originalFormat = metadata.format ?? 'unknown';

	// Per CONTEXT.md: WebP for photos (JPG/JPEG source), keep PNG for graphics
	const isPhoto = originalFormat === 'jpeg' || originalFormat === 'jpg';

	let outputBuffer: Buffer;
	let mimeType: string;
	let wasConverted = false;

	if (isPhoto) {
		// Convert photos to WebP for smaller file size
		outputBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
		mimeType = 'image/webp';
		wasConverted = true;
	} else {
		// Keep PNG, GIF, WebP as-is
		outputBuffer = buffer;
		mimeType = `image/${originalFormat}`;
	}

	const base64 = outputBuffer.toString('base64');

	return {
		base64,
		mimeType,
		originalFormat,
		wasConverted,
	};
}

/**
 * Convert processed image to data URI.
 */
export function toDataUri(processed: ProcessedImage): string {
	return `data:${processed.mimeType};base64,${processed.base64}`;
}

/**
 * Check if a file has an allowed image extension.
 */
export function isAllowedFormat(filePath: string): boolean {
	const ext = path.extname(filePath).toLowerCase();
	return ALLOWED_FORMATS.includes(ext);
}

export { ALLOWED_FORMATS };
