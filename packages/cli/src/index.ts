#!/usr/bin/env bun
import { Command } from 'commander';
import { createConsole } from './lib/console.ts';

const program = new Command();

program
	.name('cvgen')
	.description('Generate ATS-optimized CVs from markdown')
	.version('0.1.0');

interface BuildOptions {
	format?: string;
	locale?: string;
	watch?: string | boolean;
	parallel?: boolean;
	sequential?: boolean;
	quiet?: boolean;
	json?: boolean;
}

// Build command
program
	.command('build')
	.description('Build CV output files')
	.argument('<name>', 'Person directory name (e.g., johndoe)')
	.argument('<template>', 'Template ID to use (e.g., base)')
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
	.action(async (name: string, template: string, options: BuildOptions) => {
		// Implementation will be added in 03-03
		const cons = createConsole({ quiet: options.quiet, json: options.json });
		cons.info(`Building CV for ${name} with template ${template}...`);
		cons.warn('Build command not yet implemented');
	});

// Parse and run
program.parseAsync(process.argv).catch((err) => {
	console.error(err.message);
	process.exit(1);
});
