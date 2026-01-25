/**
 * AI validate subcommand.
 * Tests provider connectivity and API key validity.
 * Per CONTEXT.md: Optional validation command.
 */

import {
	checkOllamaConnection,
	createProvider,
	getAvailableProviders,
	loadAIConfig,
	ProviderConfigError,
	type ProviderType,
} from '../../ai/index.ts';
import {
	createConsole,
	type JsonOutput,
	outputJson,
} from '../../lib/console.ts';
import { createSpinner } from '../../lib/spinner.ts';

export interface ValidateOptions {
	provider?: string;
	quiet?: boolean;
	json?: boolean;
}

interface ValidationResult {
	provider: ProviderType;
	valid: boolean;
	error?: string;
	model?: string;
}

/**
 * Validate AI provider configuration.
 */
export async function validateAction(options: ValidateOptions): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();
	const config = await loadAIConfig(cwd);

	// Determine which providers to validate
	let providersToValidate: ProviderType[];
	if (options.provider) {
		const p = options.provider as ProviderType;
		if (!['openai', 'anthropic', 'ollama'].includes(p)) {
			cons.error(`Unknown provider: ${options.provider}`);
			cons.info('Available: openai, anthropic, ollama');
			process.exit(1);
		}
		providersToValidate = [p];
	} else {
		providersToValidate = getAvailableProviders(config);
		if (providersToValidate.length === 0) {
			cons.warn('No providers configured.');
			cons.info('Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or configure Ollama.');
			process.exit(1);
		}
	}

	const results: ValidationResult[] = [];

	for (const provider of providersToValidate) {
		const spinner = createSpinner(`Validating ${provider}...`, {
			quiet: options.quiet,
			json: options.json,
		});

		const result = await validateProvider(config, provider);
		results.push(result);

		if (spinner) {
			if (result.valid) {
				spinner.succeed(`${provider}: valid (model: ${result.model})`);
			} else {
				spinner.fail(`${provider}: ${result.error}`);
			}
		}
	}

	if (options.json) {
		const allValid = results.every((r) => r.valid);
		const output: JsonOutput & { results: ValidationResult[] } = {
			status: allValid ? 'success' : 'error',
			results,
		};
		outputJson(output);
		if (!allValid) process.exit(1);
		return;
	}

	// Summary
	const valid = results.filter((r) => r.valid).length;
	const total = results.length;
	cons.info('');
	if (valid === total) {
		cons.success(`All ${total} provider(s) validated successfully.`);
	} else {
		cons.warn(`${valid}/${total} provider(s) validated.`);
		process.exit(1);
	}
}

/**
 * Validate a single provider.
 */
async function validateProvider(
	config: Awaited<ReturnType<typeof loadAIConfig>>,
	provider: ProviderType,
): Promise<ValidationResult> {
	// Special handling for Ollama: check connection first
	if (provider === 'ollama') {
		const endpoint = config.ollama?.endpoint ?? 'http://localhost:11434/api';
		const connected = await checkOllamaConnection(endpoint);
		if (!connected) {
			return {
				provider,
				valid: false,
				error: `Cannot connect to Ollama at ${endpoint}. Is the server running?`,
			};
		}
	}

	try {
		// Attempt to create provider (will throw if API key missing)
		const providerInstance = createProvider(config, provider);
		return {
			provider,
			valid: true,
			model: providerInstance.modelId,
		};
	} catch (error) {
		if (error instanceof ProviderConfigError) {
			return {
				provider,
				valid: false,
				error: error.message,
			};
		}
		return {
			provider,
			valid: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
