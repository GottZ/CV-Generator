#!/usr/bin/env bun
import { Command } from 'commander';
import { aiCommand } from './commands/ai.ts';
import { buildAction } from './commands/build.ts';
import { initAction } from './commands/init.ts';
import { listTemplatesAction } from './commands/list-templates.ts';
import { validateAction } from './commands/validate.ts';

const program = new Command();

program
	.name('cvgen')
	.description('Generate ATS-optimized CVs from markdown')
	.version('0.1.0');

// Build command
program
	.command('build')
	.description('Build CV output files')
	.argument('<name>', 'Person directory name (e.g., johndoe)')
	.argument('<template>', 'Template ID to use (e.g., base, or "auto")')
	.option(
		'--format <formats>',
		'Output formats (comma-separated: html,pdf,docx)',
		'html,pdf,docx',
	)
	.option(
		'--locale <locales>',
		'Locales to build (comma-separated, default: all in CV)',
	)
	.option(
		'--watch [filter]',
		'Watch for changes and rebuild (cv:name, t:template)',
	)
	.option('--parallel', 'Build formats in parallel')
	.option('--sequential', 'Build formats sequentially (default)')
	.option('--quiet', 'Suppress non-error output')
	.option('--json', 'Output results as JSON')
	.option('--html-only', 'Generate HTML only (skip PDF and DOCX)')
	.option('--no-pdf', 'Skip PDF generation')
	.option('--no-docx', 'Skip DOCX generation')
	.option('--dry-run', 'Show what would be generated without generating')
	.option('--people-dir <dir>', 'People directory (default: ./people)')
	.option('--template-dir <dir>', 'Templates directory (default: ./templates)')
	.addHelpText(
		'after',
		`
Examples:
  $ cvgen build johndoe modern
  $ cvgen build johndoe base --locale en --no-pdf
  $ cvgen build johndoe modern --watch
  $ cvgen build johndoe modern --dry-run
  $ cvgen build johndoe auto              # Auto-selects if only one template
`,
	)
	.action(buildAction);

// Init command
program
	.command('init')
	.description('Scaffold a new CV directory with example content')
	.argument('[name]', 'Person name (e.g., john-doe or "John Doe")')
	.option('--quiet', 'Suppress non-error output')
	.option('--json', 'Output results as JSON')
	.addHelpText(
		'after',
		`
Examples:
  $ cvgen init john-doe
  $ cvgen init "John Doe"
  $ cvgen init              # Interactive: prompts for name
`,
	)
	.action(initAction);

// Validate command
program
	.command('validate')
	.description('Check CV markdown against schema without generating files')
	.argument('<name>', 'Person directory name (e.g., johndoe)')
	.option('--locale <locale>', 'Validate specific locale only')
	.option('--quiet', 'Suppress non-error output')
	.option('--json', 'Output results as JSON')
	.addHelpText(
		'after',
		`
Examples:
  $ cvgen validate johndoe
  $ cvgen validate johndoe --locale en
  $ cvgen validate johndoe --json
`,
	)
	.action(validateAction);

// List templates command
program
	.command('list-templates')
	.description('Show available templates')
	.option('--json', 'Output results as JSON')
	.option('--quiet', 'Suppress non-error output')
	.addHelpText(
		'after',
		`
Examples:
  $ cvgen list-templates
  $ cvgen list-templates --json
`,
	)
	.action(listTemplatesAction);

// AI command group
program.addCommand(aiCommand);

// Parse and run
program.parseAsync(process.argv).catch((err) => {
	console.error(err.message);
	process.exit(1);
});
