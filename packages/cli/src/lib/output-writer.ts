import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export interface WriteResult {
	path: string;
	bytes: number;
	overwritten: boolean;
}

/**
 * Write output file, creating directory if needed.
 * Per CONTEXT.md: Note overwrites in success message.
 */
export async function writeOutput(
	outputDir: string,
	filename: string,
	content: string,
): Promise<WriteResult> {
	// Ensure output directory exists (per CONTEXT.md)
	await mkdir(outputDir, { recursive: true });

	const outputPath = path.join(outputDir, filename);

	// Check if file exists before writing
	const existingFile = Bun.file(outputPath);
	const overwritten = await existingFile.exists();

	// Bun.write is optimized for file writing
	const bytes = await Bun.write(outputPath, content);

	return {
		path: outputPath,
		bytes,
		overwritten,
	};
}
