/**
 * Mode detection for wizard commands.
 * Determines interactive vs non-interactive execution based on TTY and flags.
 */

import pc from 'picocolors';

/**
 * Options that influence wizard execution mode.
 */
export interface WizardModeOptions {
	/** --no-input flag - force non-interactive mode */
	noInput?: boolean;
	/** --force-interactive flag - override TTY detection */
	forceInteractive?: boolean;
	/** --json-input file path or '-' for stdin */
	jsonInput?: string;
	/** --dry-run flag - validate without writing */
	dryRun?: boolean;
	/** --enhance flag - AI enhancement during wizard */
	enhance?: boolean;
	/** --json flag - output format */
	json?: boolean;
}

/**
 * Execution mode for wizard commands.
 * - interactive: Terminal prompts for user input
 * - non-interactive: Flags/JSON input, no prompts
 */
export type WizardExecutionMode = 'interactive' | 'non-interactive';

/**
 * Detect execution mode based on options and environment.
 *
 * Logic (per CONTEXT.md):
 * 1. If --force-interactive: return 'interactive' (escape hatch)
 * 2. If --no-input: return 'non-interactive'
 * 3. If process.stdin.isTTY is false: return 'non-interactive' (auto-switch)
 * 4. Otherwise: return 'interactive'
 *
 * @param options - Wizard mode options from CLI flags
 * @returns Execution mode
 */
export function detectMode(options: WizardModeOptions): WizardExecutionMode {
	// Escape hatch: --force-interactive overrides everything
	if (options.forceInteractive) {
		return 'interactive';
	}

	// Explicit non-interactive mode
	if (options.noInput) {
		return 'non-interactive';
	}

	// Auto-switch when not in a terminal (CI/CD, piped input)
	if (!process.stdin.isTTY) {
		return 'non-interactive';
	}

	// Default to interactive when in a terminal
	return 'interactive';
}

/**
 * Ensure non-interactive mode has required input.
 * Exits with validation error (code 2) if requirements not met.
 *
 * @param hasRequiredInput - Whether required input was provided (flags or --json-input)
 * @param jsonOutput - Whether --json flag is set (affects error format)
 */
export function ensureNonInteractiveRequirements(
	hasRequiredInput: boolean,
	jsonOutput: boolean,
): void {
	if (hasRequiredInput) {
		return;
	}

	const errorMessage =
		'Non-interactive mode requires input via flags or --json-input';
	const details = {
		alternatives: [
			'Provide required flags (e.g., --name, --email)',
			'Use --json-input <file> or --json-input - for stdin',
			'Use --force-interactive to enable prompts in non-TTY environment',
		],
	};

	if (jsonOutput) {
		// JSON error format for programmatic consumption
		console.error(
			JSON.stringify({
				error: errorMessage,
				code: 'MISSING_INPUT',
				...details,
			}),
		);
	} else {
		// Human-readable error format
		console.error(pc.red(`Error: ${errorMessage}`));
		console.error();
		console.error('Alternatives:');
		for (const alt of details.alternatives) {
			console.error(`  - ${alt}`);
		}
	}

	process.exit(2);
}
