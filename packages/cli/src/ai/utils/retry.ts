/**
 * Retry utility with exponential backoff for API calls.
 * Source: Phase 16 RESEARCH.md Pattern 4
 */

/**
 * Options for retry behavior.
 */
export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	maxAttempts?: number;
	/** Base delay in milliseconds (default: 1000) */
	baseDelayMs?: number;
	/** Maximum delay in milliseconds (default: 10000) */
	maxDelayMs?: number;
}

/**
 * Execute a function with automatic retry on transient errors.
 *
 * Uses exponential backoff: delay = baseDelay * 2^(attempt-1)
 * Capped at maxDelay.
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all attempts fail or non-retryable error
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchFromApi('/endpoint'),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry on non-transient errors
			if (!isRetryableError(lastError)) {
				throw lastError;
			}

			if (attempt < maxAttempts) {
				const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
				await sleep(delay);
			}
		}
	}

	// All attempts exhausted
	throw lastError;
}

/**
 * Determine if an error is transient and worth retrying.
 *
 * Checks for: rate limits, timeouts, connection errors,
 * ECONNREFUSED, 503 (service unavailable), 429 (too many requests).
 *
 * @param error - Error to check
 * @returns True if the error is likely transient
 */
export function isRetryableError(error: Error): boolean {
	const message = error.message.toLowerCase();
	return (
		message.includes('rate limit') ||
		message.includes('timeout') ||
		message.includes('connection') ||
		message.includes('econnrefused') ||
		message.includes('econnreset') ||
		message.includes('etimedout') ||
		message.includes('503') ||
		message.includes('429') ||
		message.includes('service unavailable') ||
		message.includes('too many requests') ||
		message.includes('network') ||
		message.includes('socket hang up')
	);
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
