/**
 * Output formatter for wizard commands.
 * Implements stderr/stdout separation for CI/CD pipelines.
 *
 * Follows Unix conventions:
 * - Progress/status messages to stderr
 * - Final output to stdout
 * - Standard exit codes for automation
 */

import pc from 'picocolors';

/**
 * Standard exit codes for wizard commands.
 * - SUCCESS (0): Command completed successfully
 * - GENERAL_ERROR (1): Runtime error, API failure, etc.
 * - VALIDATION_ERROR (2): User input validation failed
 * - SIGINT (130): User interrupted with Ctrl+C
 */
export const EXIT_CODES = {
	SUCCESS: 0,
	GENERAL_ERROR: 1,
	VALIDATION_ERROR: 2,
	SIGINT: 130,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

/**
 * Write progress message to stderr.
 * In JSON mode, skips progress messages for clean parsing.
 *
 * @param message - Progress message to display
 * @param jsonMode - Whether --json flag is set
 */
export function progress(message: string, jsonMode: boolean): void {
	if (jsonMode) {
		// Skip progress messages in JSON mode for clean stdout parsing
		return;
	}
	console.error(pc.dim(`[progress] ${message}`));
}

/**
 * Write final output to stdout.
 * In JSON mode, outputs JSON string.
 * In human mode, outputs formatted string.
 *
 * @param data - Data to output
 * @param jsonMode - Whether --json flag is set
 */
export function output<T>(data: T, jsonMode: boolean): void {
	if (jsonMode) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		// Human-readable output
		if (typeof data === 'string') {
			console.log(data);
		} else if (typeof data === 'object' && data !== null) {
			// For objects, try to format nicely
			console.log(formatObject(data as Record<string, unknown>));
		} else {
			console.log(String(data));
		}
	}
}

/**
 * Format an object for human-readable output.
 */
function formatObject(obj: Record<string, unknown>, indent = 0): string {
	const lines: string[] = [];
	const prefix = '  '.repeat(indent);

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			lines.push(`${prefix}${pc.cyan(key)}:`);
			lines.push(formatObject(value as Record<string, unknown>, indent + 1));
		} else if (Array.isArray(value)) {
			lines.push(`${prefix}${pc.cyan(key)}:`);
			for (const item of value) {
				if (typeof item === 'object' && item !== null) {
					lines.push(formatObject(item as Record<string, unknown>, indent + 1));
				} else {
					lines.push(`${prefix}  - ${String(item)}`);
				}
			}
		} else {
			lines.push(`${prefix}${pc.cyan(key)}: ${String(value)}`);
		}
	}

	return lines.join('\n');
}

/**
 * Error details for structured error output.
 */
export interface ErrorDetails {
	/** Error code for programmatic handling */
	code?: string;
	/** Field that caused the error */
	field?: string;
	/** Additional context */
	context?: Record<string, unknown>;
	/** Suggestions for fixing the error */
	suggestions?: string[];
}

/**
 * Write error and exit with specified code.
 * Never returns - always calls process.exit.
 *
 * @param message - Error message
 * @param details - Additional error details
 * @param jsonMode - Whether --json flag is set
 * @param code - Exit code (defaults to GENERAL_ERROR)
 */
export function exitWithError(
	message: string,
	details: ErrorDetails | unknown,
	jsonMode: boolean,
	code: keyof typeof EXIT_CODES = 'GENERAL_ERROR',
): never {
	const exitCode = EXIT_CODES[code];

	if (jsonMode) {
		// JSON error format for programmatic consumption
		const errorOutput: Record<string, unknown> = {
			error: message,
			exitCode,
		};

		// Merge details if it's an object
		if (typeof details === 'object' && details !== null) {
			Object.assign(errorOutput, details);
		}

		console.error(JSON.stringify(errorOutput));
	} else {
		// Human-readable error format
		console.error(pc.red(`Error: ${message}`));

		if (typeof details === 'object' && details !== null) {
			const detailsObj = details as ErrorDetails;

			if (detailsObj.field) {
				console.error(pc.dim(`Field: ${detailsObj.field}`));
			}

			if (detailsObj.context) {
				console.error(pc.dim('Context:'));
				for (const [key, value] of Object.entries(detailsObj.context)) {
					console.error(pc.dim(`  ${key}: ${String(value)}`));
				}
			}

			if (detailsObj.suggestions && detailsObj.suggestions.length > 0) {
				console.error();
				console.error('Suggestions:');
				for (const suggestion of detailsObj.suggestions) {
					console.error(`  - ${suggestion}`);
				}
			}
		}
	}

	process.exit(exitCode);
}
