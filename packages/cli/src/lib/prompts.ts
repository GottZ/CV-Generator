import * as readline from 'node:readline/promises';

/**
 * User's choice when prompted about existing directory.
 */
export type OverwriteChoice = 'overwrite' | 'skip' | 'cancel';

/**
 * Prompt user for overwrite action when directory already exists.
 * Per CONTEXT.md: Interactive prompt with overwrite, skip, or cancel options.
 * Per RESEARCH.md Pattern 4: readline-based prompt with proper cleanup.
 *
 * @param dirPath - Path to the existing directory (for display)
 * @returns User's choice: 'overwrite', 'skip', or 'cancel'
 */
export async function promptOverwrite(
	dirPath: string,
): Promise<OverwriteChoice> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		const answer = await rl.question(
			`Directory "${dirPath}" exists. [o]verwrite, [s]kip, or [c]ancel? `,
		);
		const normalized = answer.toLowerCase().trim();

		if (normalized === 'o' || normalized === 'overwrite') {
			return 'overwrite';
		}
		if (normalized === 's' || normalized === 'skip') {
			return 'skip';
		}
		return 'cancel';
	} finally {
		// Always close readline to prevent process hanging (RESEARCH.md Pitfall 4)
		rl.close();
	}
}

/**
 * Prompt user for person name when not provided as argument.
 * Per CONTEXT.md: Interactive mode prompts for name if not provided.
 *
 * @returns User-entered name (may be empty if user just presses Enter)
 */
export async function promptName(): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		const answer = await rl.question('Enter person name (e.g., John Doe): ');
		return answer.trim();
	} finally {
		rl.close();
	}
}
