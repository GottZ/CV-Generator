/**
 * CLI wizard commands for CV creation and editing.
 * Provides `cvgen wizard init` and `cvgen wizard add` subcommands.
 * Implements WIZ-01 through WIZ-06 and WIZ-15 through WIZ-20.
 */

import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';

import { slugifyName } from '../lib/scaffolder.ts';
import {
	detectMode,
	ensureNonInteractiveRequirements,
} from '../wizard/non-interactive/mode-detector.ts';
import {
	type AddableSection,
	runNonInteractiveAdd,
	runNonInteractiveWizard,
} from '../wizard/non-interactive/runner.ts';
import { showJsonSchema } from '../wizard/non-interactive/schema-export.ts';
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
 * Map CLI section names to AddableSection type names.
 */
const SECTION_MAP: Record<(typeof VALID_SECTIONS)[number], AddableSection> = {
	experience: 'experience',
	skills: 'skills',
	project: 'projects',
	certification: 'certifications',
	education: 'education',
};

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
  Interactive mode:
    $ cvgen wizard init jane-doe
    $ cvgen wizard add experience jane-doe

  Non-interactive mode (CI/CD):
    $ cvgen wizard init jane --no-input --json-input data.json
    $ cvgen wizard init jane --no-input --name "Jane Doe" --email "jane@example.com"
    $ cat data.json | cvgen wizard init jane --no-input --json-input -

  With AI enhancement:
    $ cvgen wizard init jane --enhance
    $ cvgen wizard add experience jane --enhance --job posting.txt

  Dry-run (validate only):
    $ cvgen wizard init jane --no-input --json-input data.json --dry-run

  JSON Schema for input format:
    $ cvgen wizard init --help json
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
		// Mode flags (WIZ-15)
		.option(
			'--no-input',
			'Non-interactive mode (requires --json-input or value flags)',
		)
		.option(
			'--force-interactive',
			'Force interactive mode even in non-TTY environment',
		)
		.option('--json-input <file>', 'JSON input file (use "-" for stdin)')
		.option('--dry-run', 'Validate without writing files')
		.option('--json', 'Output as JSON (implies --no-input)')
		// AI enhancement flags (WIZ-17, WIZ-20)
		.option('--enhance', 'Enable AI enhancement for content')
		.option('--provider <name>', 'AI provider (openai, anthropic, ollama)')
		.option('--job <file>', 'Job description file for tailored enhancement')
		// Contact value flags (WIZ-16)
		.option('--name <name>', 'Full name')
		.option('--email <email>', 'Email address')
		.option('--phone <phone>', 'Phone number')
		.option('--location <location>', 'Location (City, Country)')
		.option('--linkedin <url>', 'LinkedIn profile URL')
		.option('--github <url>', 'GitHub profile URL')
		.option('--website <url>', 'Personal website URL')
		// Standard options
		.option('--locale <locale>', 'CV locale', 'en')
		.option('--people-dir <dir>', 'People directory', './people')
		.option('--help-json', 'Show JSON Schema for input format')
		.action(async (name: string, options) => {
			// Handle --help-json for JSON Schema output (WIZ-15)
			if (options.helpJson) {
				showJsonSchema('init');
				return;
			}

			const personName = slugifyName(name);
			const personDir = path.resolve(options.peopleDir, personName);

			// Detect mode (TTY auto-switching per CONTEXT.md)
			const mode = detectMode({
				noInput: !options.input, // Commander negates --no-input to input: false
				forceInteractive: options.forceInteractive,
				jsonInput: options.jsonInput,
				dryRun: options.dryRun,
				enhance: options.enhance,
				json: options.json,
			});

			try {
				if (mode === 'non-interactive') {
					// Check we have input
					const hasInput = options.jsonInput || options.name;
					ensureNonInteractiveRequirements(hasInput, options.json ?? false);

					await runNonInteractiveWizard({
						personDir,
						personName,
						locale: options.locale,
						flags: {
							name: options.name,
							email: options.email,
							phone: options.phone,
							location: options.location,
							linkedIn: options.linkedin,
							github: options.github,
							website: options.website,
						},
						jsonInput: options.jsonInput,
						dryRun: options.dryRun ?? false,
						enhance: options.enhance ?? false,
						provider: options.provider,
						job: options.job,
						json: options.json ?? false,
					});
				} else {
					// Interactive mode
					await runWizard({
						personDir,
						personName,
						locale: options.locale,
						enhance: options.enhance,
						provider: options.provider,
						job: options.job,
					});
				}
			} catch (error) {
				if ((error as Error).name === 'ExitPromptError') {
					// Silently exit - already handled by runner
					return;
				}
				console.error(pc.red('Error:'), (error as Error).message);
				process.exit(1);
			}
		});

	// Add subcommand
	wizard
		.command('add')
		.description('Add a section to an existing CV')
		.argument('<section>', `Section to add: ${VALID_SECTIONS.join(', ')}`)
		.argument('<name>', 'Person name or directory name')
		// Mode flags (WIZ-15)
		.option('--no-input', 'Non-interactive mode')
		.option('--force-interactive', 'Force interactive mode')
		.option('--json-input <file>', 'JSON input file (use "-" for stdin)')
		.option('--dry-run', 'Validate without writing files')
		.option('--json', 'Output as JSON')
		// AI enhancement flags (WIZ-17, WIZ-20)
		.option('--enhance', 'Enable AI enhancement')
		.option('--provider <name>', 'AI provider')
		.option('--job <file>', 'Job description file')
		// Standard options
		.option('--locale <locale>', 'CV locale', 'en')
		.option('--people-dir <dir>', 'People directory', './people')
		.action(async (section: string, name: string, options) => {
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

			const mode = detectMode({
				noInput: !options.input,
				forceInteractive: options.forceInteractive,
				jsonInput: options.jsonInput,
				dryRun: options.dryRun,
				enhance: options.enhance,
				json: options.json,
			});

			try {
				if (mode === 'non-interactive') {
					const hasInput = options.jsonInput;
					ensureNonInteractiveRequirements(hasInput, options.json ?? false);

					// Map CLI section name to AddableSection type
					const addableSection =
						SECTION_MAP[section as (typeof VALID_SECTIONS)[number]];

					await runNonInteractiveAdd(addableSection, {
						personDir,
						personName,
						locale: options.locale,
						flags: {},
						jsonInput: options.jsonInput,
						dryRun: options.dryRun ?? false,
						enhance: options.enhance ?? false,
						provider: options.provider,
						job: options.job,
						json: options.json ?? false,
					});
				} else {
					// Interactive mode
					await runAddSection(section, {
						personDir,
						personName,
						locale: options.locale,
						enhance: options.enhance,
						provider: options.provider,
						job: options.job,
					});
				}
			} catch (error) {
				if ((error as Error).name === 'ExitPromptError') {
					// Silently exit - already handled by runner
					return;
				}
				console.error(pc.red('Error:'), (error as Error).message);
				process.exit(1);
			}
		});

	return wizard;
}

/**
 * Wizard command instance for CLI registration.
 */
export const wizardCommand = createWizardCommand();
