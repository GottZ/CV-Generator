/**
 * Context command for section details lookup.
 * Shows analysis and improvement context for specific CV sections.
 */

import pc from 'picocolors';
import {
	formatSectionContext,
	formatSectionContextJson,
	formatSectionContextMarkdown,
	formatSectionList,
	loadWorkflowState,
} from '../../ai/workflow/index.ts';

interface ContextOptions {
	verbose?: boolean;
	format?: 'terminal' | 'md' | 'json';
	quiet?: boolean;
}

/**
 * CLI action for `cvgen ai context <name> [section]`.
 * Lists sections or shows section-specific context.
 *
 * @param name - Person directory name
 * @param section - Optional section name to show
 * @param options - Command options
 */
export async function contextAction(
	name: string | undefined,
	section: string | undefined,
	options: ContextOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai context <name> [section]');
		process.exit(1);
	}

	const personDir = `./people/${name}`;

	// Load workflow state
	const state = await loadWorkflowState(personDir);

	if (!state) {
		console.error(pc.red(`Error: No workflow state found for ${name}.`));
		console.error(`Run ${pc.cyan(`cvgen ai analyze ${name}`)} first.`);
		process.exit(1);
	}

	// No section specified - list available sections
	if (!section) {
		if (options.format === 'json') {
			console.log(
				JSON.stringify(
					{
						sections: state.stageResults.analyze?.sections || [],
					},
					null,
					2,
				),
			);
			return;
		}

		if (!options.quiet) {
			console.log(formatSectionList(state));
		}
		return;
	}

	// Section specified - show context for that section
	try {
		if (options.format === 'json') {
			console.log(
				JSON.stringify(formatSectionContextJson(state, section), null, 2),
			);
			return;
		}

		if (options.format === 'md') {
			console.log(formatSectionContextMarkdown(state, section));
			return;
		}

		// Default: terminal format
		if (!options.quiet) {
			console.log(
				formatSectionContext(state, section, options.verbose || false),
			);
		}
	} catch (error) {
		console.error(
			pc.red(error instanceof Error ? error.message : 'Unknown error'),
		);
		process.exit(1);
	}
}
