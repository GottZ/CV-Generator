/**
 * Masked API key input for AI provider authentication.
 * Per WIZ-11: API keys and sensitive inputs masked during entry.
 */

import { password } from '@inquirer/prompts';

/**
 * Prompt for API key with masked input (WIZ-11).
 * Uses @inquirer/password to hide keystrokes.
 *
 * @param provider - Provider name for context in message
 * @returns The entered API key
 */
export async function promptApiKey(provider: string): Promise<string> {
	return password({
		message: `Enter ${provider} API key (input will be masked):`,
		mask: '*',
		validate: (value) => {
			if (!value || value.length === 0) {
				return 'API key is required';
			}
			if (value.length < 10) {
				return 'API key seems too short';
			}
			// Basic format check - most API keys are alphanumeric with dashes/underscores
			if (!/^[A-Za-z0-9_-]+$/.test(value)) {
				return 'API key contains invalid characters';
			}
			return true;
		},
	});
}
