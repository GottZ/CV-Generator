/**
 * Wizard validation layer.
 * Provides immediate feedback with re-prompt pattern per CONTEXT.md.
 */

import { input } from '@inquirer/prompts';
import pc from 'picocolors';

/**
 * Validate a date string.
 * Accepts: empty (optional), 'present', YYYY-MM, YYYY-M, Month YYYY, MM/YYYY
 * @param value - Date string to validate
 * @returns true if valid, error message if invalid
 */
export function validateDate(value: string): true | string {
	const trimmed = value.trim();

	// Empty is valid (optional)
	if (!trimmed) return true;

	// 'present' is valid
	if (trimmed.toLowerCase() === 'present') return true;

	// YYYY-MM or YYYY-M format
	if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
		const [year, month] = trimmed.split('-').map(Number);
		if (year && month && month >= 1 && month <= 12) return true;
		return 'Enter date as YYYY-MM (e.g., 2023-01) or "present"';
	}

	// YYYY-MM-DD format (with day, normalized to YYYY-MM)
	if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
		const [year, month] = trimmed.split('-').map(Number);
		if (year && month && month >= 1 && month <= 12) return true;
		return 'Enter date as YYYY-MM (e.g., 2023-01) or "present"';
	}

	// MM/YYYY format
	if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
		const [month, year] = trimmed.split('/').map(Number);
		if (year && month && month >= 1 && month <= 12) return true;
		return 'Enter date as YYYY-MM (e.g., 2023-01) or "present"';
	}

	// Month YYYY format (e.g., January 2023, Jan 2023)
	const monthNameRegex =
		/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}$/i;
	if (monthNameRegex.test(trimmed)) return true;

	return 'Enter date as YYYY-MM (e.g., 2023-01) or "present"';
}

/**
 * Validate an email address.
 * @param value - Email string to validate
 * @returns true if valid or empty, error message if invalid
 */
export function validateEmail(value: string): true | string {
	const trimmed = value.trim();

	// Empty is valid (optional)
	if (!trimmed) return true;

	// Basic email format validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (emailRegex.test(trimmed)) return true;

	return 'Please enter a valid email address';
}

/**
 * Validate that a field is not empty.
 * @param value - Value to check
 * @param fieldName - Field name for error message
 * @returns true if valid, error message if empty
 */
export function validateRequired(
	value: string,
	fieldName: string,
): true | string {
	const trimmed = value.trim();
	if (trimmed) return true;
	return `${fieldName} is required`;
}

/**
 * Configuration for createValidatingInput.
 */
export interface ValidatingInputConfig {
	/** Prompt message */
	message: string;
	/** Whether the field is required */
	required?: boolean;
	/** Custom validation function */
	validate?: (value: string) => true | string;
	/** ATS warning function (returns warning string or null) */
	atsWarning?: (value: string) => string | null;
	/** Default value */
	default?: string;
}

/**
 * Internal state for tracking validation attempts.
 */
interface ValidationAttemptState {
	previousValue: string | null;
	attemptCount: number;
}

/**
 * Create an input prompt with validation and re-prompt pattern.
 * Per CONTEXT.md: "Re-prompt on first error; if same invalid value submitted again, continue but track"
 *
 * @param config - Input configuration
 * @returns Promise resolving to the entered value
 */
export async function createValidatingInput(
	config: ValidatingInputConfig,
): Promise<string> {
	const attemptState: ValidationAttemptState = {
		previousValue: null,
		attemptCount: 0,
	};

	return input({
		message: config.message,
		default: config.default,
		validate: (value) => {
			const trimmed = value.trim();

			// Check required
			if (config.required && !trimmed) {
				return `This field is required`;
			}

			// Run custom validation
			if (config.validate) {
				const result = config.validate(trimmed);
				if (result !== true) {
					// First attempt with this value: show error
					if (attemptState.previousValue !== trimmed) {
						attemptState.previousValue = trimmed;
						attemptState.attemptCount = 1;
						return result;
					}

					// Same value submitted again
					attemptState.attemptCount++;
					if (attemptState.attemptCount >= 2) {
						// Second attempt: warn and continue
						console.log(pc.yellow(`Warning: ${result} (continuing anyway)`));
						return true;
					}

					return result;
				}
			}

			// Check ATS warnings (doesn't block, just warns)
			if (config.atsWarning) {
				const warning = config.atsWarning(trimmed);
				if (warning) {
					console.log(pc.yellow(`ATS Warning: ${warning}`));
				}
			}

			return true;
		},
	});
}
