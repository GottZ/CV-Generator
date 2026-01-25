/**
 * AI command group.
 * Parent command for all AI-related subcommands.
 * Phase 14: prompt, config, validate
 * Phase 15+: status, context, bullets, summary, etc.
 */

import { Command } from 'commander';
import { configAction } from './ai/config.ts';
import { promptAction } from './ai/prompt.ts';
import { validateAction } from './ai/validate.ts';

/**
 * Create the AI command with all subcommands.
 */
export function createAICommand(): Command {
	const ai = new Command('ai')
		.description('AI-assisted CV improvement commands')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai prompt analyze --person johndoe
  $ cvgen ai config
  $ cvgen ai validate
  $ cvgen ai prompt summarize --person johndoe --locale en
`,
		);

	// Prompt subcommand - export prompts for manual LLM use
	ai.command('prompt [name]')
		.description('Export AI prompt for manual use (no API key required)')
		.option('--person <name>', 'Person directory name (e.g., johndoe)')
		.option(
			'--locale <locale>',
			'Locale for CV content (default: first available)',
		)
		.option('--job <file>', 'Job description file (for tailor prompt)')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai prompt                           # List available prompts
  $ cvgen ai prompt analyze --person johndoe  # Export analyze prompt
  $ cvgen ai prompt tailor --person johndoe --job posting.txt
  $ cvgen ai prompt summarize --person johndoe | pbcopy  # Copy to clipboard
`,
		)
		.action(promptAction);

	// Config subcommand - display current configuration
	ai.command('config')
		.description('Display current AI configuration')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai config
  $ cvgen ai config --json
`,
		)
		.action(configAction);

	// Validate subcommand - test provider connectivity
	ai.command('validate')
		.description('Test AI provider connectivity')
		.option(
			'--provider <provider>',
			'Specific provider to validate (openai, anthropic, ollama)',
		)
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai validate                    # Validate all configured providers
  $ cvgen ai validate --provider openai  # Validate OpenAI only
  $ cvgen ai validate --json
`,
		)
		.action(validateAction);

	return ai;
}

/**
 * Export the configured AI command.
 */
export const aiCommand = createAICommand();
