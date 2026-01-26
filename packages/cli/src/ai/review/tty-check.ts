/**
 * TTY detection and non-interactive environment handling.
 * Ensures graceful fallback when terminal is not available.
 */

import pc from 'picocolors';

/**
 * Check if stdin is a TTY (terminal).
 * @returns true if running in an interactive terminal
 */
export function isTTY(): boolean {
	return process.stdin.isTTY === true;
}

/**
 * Get terminal width for responsive display.
 * @returns terminal width in columns, defaults to 80 if unavailable
 */
export function getTerminalWidth(): number {
	return process.stdout.columns || 80;
}

/**
 * Ensure the environment supports interactive prompts.
 * Exits with helpful message if not in a TTY.
 *
 * @param options.force - Bypass TTY check (for testing)
 */
export function ensureInteractiveMode(options?: { force?: boolean }): void {
	if (options?.force) {
		return;
	}

	if (!process.stdin.isTTY) {
		console.log(pc.red('Error: Interactive mode requires a terminal.'));
		console.log();
		console.log('For non-interactive use:');
		console.log('  --json           Output suggestions as JSON');
		console.log('  --accept-all     Accept all suggestions without review');
		console.log('  --dry-run        Show changes without writing');
		process.exit(1);
	}
}
