/**
 * CLI wizard commands for CV creation and editing.
 * Provides `cvgen wizard init` and `cvgen wizard add` subcommands.
 * Implements WIZ-01 through WIZ-06.
 */

import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';

import { slugifyName } from '../lib/scaffolder.ts';
import { runAddSection, runWizard } from '../wizard/runner.ts';

/**
 * Valid section names for the add command.
 */
const VALID_SECTIONS = [
	'experience',
	'skills',
	'project',
	'certification',
	'education',
] as const;

/**
 * Create the wizard command group.
 * @returns Commander command with init and add subcommands
 */
export function createWizardCommand(): Command {
	const wizard = new Command('wizard')
		.description('Interactive wizard for CV creation and editing')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen wizard init jane-doe
  $ cvgen wizard init "Jane Doe" --locale de
  $ cvgen wizard add experience jane-doe
  $ cvgen wizard add skills jane-doe
  $ cvgen wizard add project jane-doe
  $ cvgen wizard add certification jane-doe
  $ cvgen wizard add education jane-doe
`,
		);

	// Init subcommand
	wizard
		.command('init')
		.description('Create a new CV through guided prompts')
		.argument(
			'<name>',
			'Person name or directory name (e.g., "jane-doe" or "Jane Doe")',
		)
		.option('--locale <locale>', 'CV locale', 'en')
		.option('--people-dir <dir>', 'People directory', './people')
		.action(
			async (name: string, options: { locale: string; peopleDir: string }) => {
				const personName = slugifyName(name);
				const personDir = path.resolve(options.peopleDir, personName);

				try {
					await runWizard({
						personDir,
						personName,
						locale: options.locale,
					});
				} catch (error) {
					if ((error as Error).name === 'ExitPromptError') {
						// Silently exit - already handled by runner
						return;
					}
					console.error(pc.red('Error:'), (error as Error).message);
					process.exit(1);
				}
			},
		);

	// Add subcommand
	wizard
		.command('add')
		.description('Add a section to an existing CV')
		.argument('<section>', `Section to add: ${VALID_SECTIONS.join(', ')}`)
		.argument('<name>', 'Person name or directory name')
		.option('--locale <locale>', 'CV locale', 'en')
		.option('--people-dir <dir>', 'People directory', './people')
		.action(
			async (
				section: string,
				name: string,
				options: { locale: string; peopleDir: string },
			) => {
				// Validate section
				if (
					!VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])
				) {
					console.error(pc.red(`Error: Invalid section '${section}'`));
					console.error(pc.dim(`Valid sections: ${VALID_SECTIONS.join(', ')}`));
					process.exit(1);
				}

				const personName = slugifyName(name);
				const personDir = path.resolve(options.peopleDir, personName);

				try {
					await runAddSection(section, {
						personDir,
						personName,
						locale: options.locale,
					});
				} catch (error) {
					if ((error as Error).name === 'ExitPromptError') {
						// Silently exit - already handled by runner
						return;
					}
					console.error(pc.red('Error:'), (error as Error).message);
					process.exit(1);
				}
			},
		);

	return wizard;
}

/**
 * Wizard command instance for CLI registration.
 */
export const wizardCommand = createWizardCommand();
