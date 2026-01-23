import ora, { type Ora } from 'ora';

export interface SpinnerOptions {
	quiet?: boolean;
	json?: boolean;
}

/**
 * Handle to an active spinner, or null if spinner was suppressed.
 * Use with optional chaining: spinner?.succeed('Done')
 */
export type SpinnerHandle = Ora | null;

/**
 * Create a terminal spinner with TTY-aware behavior.
 *
 * Returns null (suppressed) when:
 * - quiet mode is enabled (--quiet flag)
 * - JSON output mode is enabled (--json flag)
 * - stdout is not a TTY (piped output, non-interactive)
 *
 * @param text - Initial spinner message
 * @param options - SpinnerOptions with quiet/json flags
 * @returns Ora spinner instance or null if suppressed
 *
 * @example
 * const spinner = createSpinner('Generating PDF...', options);
 * try {
 *   await generatePdf();
 *   spinner?.succeed('PDF generated');
 * } catch (error) {
 *   spinner?.fail('PDF generation failed');
 *   throw error;
 * }
 */
export function createSpinner(
	text: string,
	options: SpinnerOptions,
): SpinnerHandle {
	// Suppress spinner in quiet mode, JSON mode, or non-TTY environments
	// Per RESEARCH.md Pitfall 2: prevents garbled output in piped environments
	if (options.quiet || options.json || !process.stdout.isTTY) {
		return null;
	}

	return ora({ text, color: 'cyan' }).start();
}
