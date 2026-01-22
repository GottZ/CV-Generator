/**
 * Parse error or warning with location context.
 */
export interface ParseError {
	/** 'error' stops generation, 'warning' continues */
	type: "error" | "warning";
	/** Line number in source markdown (1-indexed) */
	line?: number;
	/** Column number (1-indexed) */
	column?: number;
	/** Human-readable error message */
	message: string;
	/** Suggested fix if applicable */
	suggestion?: string;
	/** Snippet of problematic content for context */
	context?: string;
}

/**
 * Result of parsing operation with error collection.
 * Data is null if any errors (not warnings) occurred.
 */
export interface ParseResult<T> {
	/** Parsed data, null if errors exist */
	data: T | null;
	/** Errors that prevent generation */
	errors: ParseError[];
	/** Warnings that allow generation to continue */
	warnings: ParseError[];
}
