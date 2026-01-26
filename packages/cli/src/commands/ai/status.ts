/**
 * Status command for workflow visibility.
 * Shows current workflow stage and progress.
 */

import pc from 'picocolors';
import {
	formatStatus,
	formatStatusJson,
	loadWorkflowState,
} from '../../ai/workflow/index.ts';

interface StatusOptions {
	quiet?: boolean;
	json?: boolean;
}

/**
 * CLI action for `cvgen ai status <name>`.
 * Displays workflow progress table with completion timestamps.
 *
 * @param name - Person directory name
 * @param options - Command options
 */
export async function statusAction(
	name: string | undefined,
	options: StatusOptions,
): Promise<void> {
	if (!name) {
		console.error(pc.red('Error: Person name is required'));
		console.error('Usage: cvgen ai status <name>');
		process.exit(1);
	}

	const personDir = `./people/${name}`;

	// Load workflow state
	const state = await loadWorkflowState(personDir);

	if (!state) {
		if (options.json) {
			console.log(
				JSON.stringify({ error: 'No workflow started', status: 'not_started' }),
			);
			return;
		}

		if (!options.quiet) {
			console.log(pc.yellow(`No workflow started for ${name}.`));
			console.log(`Start with: ${pc.cyan(`cvgen ai analyze ${name}`)}`);
		}
		return;
	}

	if (options.json) {
		console.log(JSON.stringify(formatStatusJson(state), null, 2));
		return;
	}

	if (!options.quiet) {
		console.log(formatStatus(state, name));
	}
}
