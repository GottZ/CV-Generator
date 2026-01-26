/**
 * CLI template commands for template management.
 * Provides `cvgen template copy`, `cvgen template validate`, and `cvgen template wizard`.
 * Implements TPL-01, TPL-05, TPL-06.
 */

import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';

import {
	copyTemplate,
	runTemplateWizard,
	validateTemplate,
} from '../template/index.ts';

/**
 * Create the template command group.
 * @returns Commander command with copy, validate, and wizard subcommands
 */
export function createTemplateCommand(): Command {
	const template = new Command('template')
		.description('Manage CV templates')
		.addHelpText(
			'after',
			`
Examples:
  Copy a template:
    $ cvgen template copy modern my-custom

  Validate a custom template:
    $ cvgen template validate my-custom

  Create template via wizard:
    $ cvgen template wizard
`,
		);

	// TPL-01: cvgen template copy [source] [target]
	template
		.command('copy')
		.description('Create a copy of an existing template')
		.argument('<source>', 'Source template ID (e.g., modern, classic, minimal)')
		.argument('<target>', 'Target template ID (e.g., my-custom)')
		.option('--templates-dir <dir>', 'Templates directory', './templates')
		.action(async (source: string, target: string, options) => {
			const templatesDir = path.resolve(options.templatesDir);

			try {
				await copyTemplate(source, target, templatesDir);
				const targetPath = path.join(templatesDir, target);
				console.log(pc.green(`Template copied to ${targetPath}/`));
				console.log(
					pc.dim(`Use with: cvgen build <name> --template ${target}`),
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(pc.red('Error:'), message);
				process.exit(1);
			}
		});

	// TPL-05: cvgen template validate [name]
	template
		.command('validate')
		.description('Validate a custom template structure')
		.argument('<name>', 'Template ID to validate')
		.option('--templates-dir <dir>', 'Templates directory', './templates')
		.option('--json', 'Output validation result as JSON')
		.action(async (name: string, options) => {
			const templatesDir = path.resolve(options.templatesDir);

			try {
				const result = await validateTemplate(name, templatesDir);

				if (options.json) {
					console.log(JSON.stringify(result, null, 2));
					process.exit(result.valid ? 0 : 1);
					return;
				}

				if (result.valid) {
					console.log(pc.green(`Template "${name}" is valid`));
				} else {
					console.log(pc.red(`Template "${name}" has errors:`));
					for (const error of result.errors) {
						console.log(pc.red(`  - ${error}`));
					}
				}

				for (const warning of result.warnings) {
					console.log(pc.yellow(`  Warning: ${warning}`));
				}

				process.exit(result.valid ? 0 : 1);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(pc.red('Error:'), message);
				process.exit(1);
			}
		});

	// TPL-06: cvgen template wizard
	template
		.command('wizard')
		.description('Create a customized template through guided prompts')
		.option('--templates-dir <dir>', 'Templates directory', './templates')
		.action(async (options) => {
			const templatesDir = path.resolve(options.templatesDir);

			try {
				await runTemplateWizard(templatesDir);
			} catch (error) {
				// Handle Ctrl+C gracefully
				if ((error as Error).name === 'ExitPromptError') {
					console.log(pc.yellow('\n  Template wizard cancelled.'));
					process.exit(130);
				}

				const message = error instanceof Error ? error.message : String(error);
				console.error(pc.red('Error:'), message);
				process.exit(1);
			}
		});

	return template;
}

/**
 * Template command instance for CLI registration.
 */
export const templateCommand = createTemplateCommand();
