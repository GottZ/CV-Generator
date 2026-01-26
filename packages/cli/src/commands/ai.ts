/**
 * AI command group.
 * Parent command for all AI-related subcommands.
 * Phase 14: prompt, config, validate
 * Phase 15+: status, context, bullets, summary, etc.
 */

import { Command } from 'commander';
import { analyzeAction } from './ai/analyze.ts';
import { bulletsAction } from './ai/bullets.ts';
import { configAction } from './ai/config.ts';
import { contextAction } from './ai/context.ts';
import { improveAction } from './ai/improve.ts';
import { keywordsAction } from './ai/keywords.ts';
import { promptAction } from './ai/prompt.ts';
import { statusAction } from './ai/status.ts';
import { summarizeAction } from './ai/summarize.ts';
import { summaryAction } from './ai/summary.ts';
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

	// Improve subcommand - Stage 2: Generate improved bullets with interactive review
	ai.command('improve <name>')
		.description(
			'Stage 2: Generate improved achievement bullets using STAR method',
		)
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--force', 'Re-run even if stage is complete')
		.option('--dry-run', 'Show suggestions without writing changes')
		.option('--accept-all', 'Accept all suggestions without interactive review')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai improve johndoe                  # Interactive review (default)
  $ cvgen ai improve johndoe --dry-run        # Preview without writing
  $ cvgen ai improve johndoe --accept-all     # Accept all with confirmation
  $ cvgen ai improve johndoe --provider openai
  $ cvgen ai improve johndoe --force          # Re-run even if complete
  $ cvgen ai improve johndoe --json           # Output as JSON (non-interactive)
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

	// Tailor subcommand - Adapt CV for job description (AI-10)
	ai.command('tailor <name>')
		.description('Tailor CV content for a specific job description')
		.requiredOption(
			'--job <source>',
			'Job description source (file path, URL, or - for stdin)',
		)
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--output <file>', 'Write tailored summary to cv.md file')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai tailor johndoe --job posting.txt           # From file
  $ cvgen ai tailor johndoe --job https://jobs.co/123   # From URL
  $ cat posting.txt | cvgen ai tailor johndoe --job -   # From stdin
  $ cvgen ai tailor johndoe --job posting.txt --output tailored-summary.md
  $ cvgen ai tailor johndoe --job posting.txt --json
`,
		)
		.action(tailorAction);

	// Status subcommand - View workflow progress
	ai.command('status <name>')
		.description('View current workflow stage and progress')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai status jane
  $ cvgen ai status jane --json
`,
		)
		.action(statusAction);

	// Context subcommand - Lookup section details
	ai.command('context <name> [section]')
		.description('Lookup context details from previous stages')
		.option('--verbose', 'Show full history through all stages')
		.option('--format <format>', 'Output format: terminal (default), md, json')
		.option('--quiet', 'Suppress non-error output')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai context jane              # List available sections
  $ cvgen ai context jane experience   # Show experience section context
  $ cvgen ai context jane experience --verbose
  $ cvgen ai context jane experience --format=json
`,
		)
		.action(contextAction);

	// Keywords subcommand - ATS keyword analysis (AI-08)
	ai.command('keywords <name>')
		.description('Analyze ATS keywords and suggest placements')
		.requiredOption('--job <file>', 'Path to job description file')
		.option('--exact', 'Use exact matching instead of fuzzy matching')
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai keywords jane --job posting.txt
  $ cvgen ai keywords jane --job job.md --exact
  $ cvgen ai keywords jane --job posting.txt --provider openai
  $ cvgen ai keywords jane --job posting.txt --json
`,
		)
		.action(keywordsAction);

	// Bullets subcommand - Generate achievement bullets (AI-06)
	ai.command('bullets <name>')
		.description(
			'Generate STAR-formatted achievement bullets for work experience',
		)
		.option('--show-star', 'Include STAR breakdown in output')
		.option('--tailored', 'Use job description context for tailoring')
		.option('--job <source>', 'Job description source (file path or URL)')
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--output <file>', 'Write bullets to file instead of stdout')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai bullets jane                                # Generate bullets
  $ cvgen ai bullets jane --show-star                    # Show STAR breakdown
  $ cvgen ai bullets jane --tailored --job posting.txt   # Tailored to job
  $ cvgen ai bullets jane --output bullets.md            # Write to file
  $ cvgen ai bullets jane --provider openai              # Use specific provider
  $ cvgen ai bullets jane --json                         # Output as JSON
`,
		)
		.action(bulletsAction);

	// Summary subcommand - Generate professional summary (AI-07)
	// Note: Distinct from 'summarize' which is a workflow stage command
	ai.command('summary <name>')
		.description(
			'Generate professional summary from CV (standalone, not workflow)',
		)
		.option('--target-role <role>', 'Target role to tailor summary for')
		.option(
			'--provider <provider>',
			'AI provider to use (openai, anthropic, ollama)',
		)
		.option('--output <file>', 'Write summary to file instead of stdout')
		.option('--quiet', 'Suppress non-error output')
		.option('--json', 'Output as JSON')
		.addHelpText(
			'after',
			`
Examples:
  $ cvgen ai summary jane                                  # Generate summary
  $ cvgen ai summary jane --target-role "Senior Engineer"  # For specific role
  $ cvgen ai summary jane --output summary.md              # Write to file
  $ cvgen ai summary jane --provider openai                # Use specific provider
  $ cvgen ai summary jane --json                           # Output as JSON

Note: This is a standalone generator. For the workflow stage command
that builds on previous analysis, use 'cvgen ai summarize' instead.
`,
		)
		.action(summaryAction);

	return ai;
}

/**
 * Export the configured AI command.
 */
export const aiCommand = createAICommand();
