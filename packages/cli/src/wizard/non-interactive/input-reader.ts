/**
 * JSON input reader for non-interactive wizard mode.
 * Handles reading from file path or stdin (via "-" argument).
 */

import { readFile } from 'node:fs/promises';

/**
 * Read JSON input from a file or stdin.
 *
 * @param source - File path or "-" for stdin
 * @returns Parsed JSON data (type unknown, caller validates)
 * @throws Error if file not found, stdin unavailable, or invalid JSON
 */
export async function readJsonInput(source: string): Promise<unknown> {
	let content: string;

	if (source === '-') {
		// Read from stdin
		content = await readStdin();
	} else {
		// Read from file
		try {
			content = await readFile(source, 'utf-8');
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			if (err.code === 'ENOENT') {
				throw new Error(`JSON input file not found: ${source}`);
			}
			if (err.code === 'EISDIR') {
				throw new Error(`Expected file but got directory: ${source}`);
			}
			throw new Error(`Failed to read JSON input file: ${err.message}`);
		}
	}

	// Parse JSON
	try {
		return JSON.parse(content);
	} catch (error) {
		const parseError = error as SyntaxError;
		throw new Error(`Invalid JSON in input: ${parseError.message}`);
	}
}

/**
 * Read content from stdin.
 * Per RESEARCH.md: check TTY before reading to avoid hang.
 *
 * @returns Content read from stdin
 * @throws Error if stdin is a TTY (no data available)
 */
async function readStdin(): Promise<string> {
	// Per RESEARCH.md pitfall: check TTY before reading to avoid hang
	if (process.stdin.isTTY) {
		throw new Error(
			'Cannot read from stdin in interactive mode. Use a file path instead of "-"',
		);
	}

	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Parse JSON content with clear error messages.
 * Useful when JSON comes from other sources (e.g., CLI flags).
 *
 * @param content - Raw JSON string
 * @param source - Description of source for error messages
 * @returns Parsed JSON data
 * @throws Error with helpful message if parsing fails
 */
export function parseJsonContent(content: string, source: string): unknown {
	try {
		return JSON.parse(content);
	} catch (error) {
		const parseError = error as SyntaxError;
		throw new Error(`Invalid JSON from ${source}: ${parseError.message}`);
	}
}
