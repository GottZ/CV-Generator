/**
 * AI command group.
 * Parent command for all AI-related subcommands.
 * Phase 14: prompt, config, validate
 * Phase 15+: status, context, bullets, summary, etc.
 */

import { Command } from 'commander';
import { analyzeAction } from './ai/analyze.ts';
import { configAction } from './ai/config.ts';
import { improveAction } from './ai/improve.ts';
import { promptAction } from './ai/prompt.ts';
import { summarizeAction } from './ai/summarize.ts';
import { tailorAction } from './ai/tailor.ts';
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

	// Analyze subcommand - Stage 1: Analyze CV structure
	ai.command('analyze <name>')
		.description(
			'Stage 1: Analyze CV structure and identify improvement opportunities',
		)
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--force', 'Re-run even if stage is complete')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai analyze johndoe
  $ cvgen ai analyze johndoe --provider openai
  $ cvgen ai analyze johndoe --force  # Re-run even if complete
  $ cvgen ai analyze johndoe --json   # Output as JSON
`,
		)
		.action(analyzeAction);

	// Improve subcommand - Stage 2: Generate improved bullets
	ai.command('improve <name>')
		.description(
			'Stage 2: Generate improved achievement bullets using STAR method',
		)
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--force', 'Re-run even if stage is complete')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai improve johndoe
  $ cvgen ai improve johndoe --provider openai
  $ cvgen ai improve johndoe --force  # Re-run even if complete
  $ cvgen ai improve johndoe --json   # Output as JSON
`,
		)
		.action(improveAction);

	// Summarize subcommand - Stage 3: Generate professional summary
	ai.command('summarize <name>')
		.description('Stage 3: Generate professional summary from CV content')
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--force', 'Re-run even if stage is complete')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai summarize johndoe
  $ cvgen ai summarize johndoe --provider openai
  $ cvgen ai summarize johndoe --force  # Re-run even if complete
  $ cvgen ai summarize johndoe --json   # Output as JSON
`,
		)
		.action(summarizeAction);

	// Tailor subcommand - Stage 4: Adapt CV for job description (optional)
	ai.command('tailor <name>')
		.description(
			'Stage 4: Adapt CV content for a specific job description (optional)',
		)
		.requiredOption('--job <file>', 'Path to job description file')
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--force', 'Re-run even if stage is complete')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai tailor johndoe --job posting.txt
  $ cvgen ai tailor johndoe --job job.md --provider openai
  $ cvgen ai tailor johndoe --job posting.txt --force
  $ cvgen ai tailor johndoe --job posting.txt --json
`,
		)
		.action(tailorAction);

	return ai;
}

/**
 * Export the configured AI command.
 */
export const aiCommand = createAICommand();
