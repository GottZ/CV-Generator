import pc from 'picocolors';

export interface ConsoleOptions {
	quiet?: boolean;
	json?: boolean;
}

export interface ConsoleResult {
	success: (message: string) => void;
	warn: (message: string) => void;
	error: (message: string) => void;
	info: (message: string) => void;
	/** Whether quiet mode is enabled (--quiet flag) */
	quiet: boolean;
	/** Whether JSON output mode is enabled (--json flag) */
	json: boolean;
}

export function createConsole(options: ConsoleOptions): ConsoleResult {
	const isTTY = process.stdout.isTTY && !options.json;

	return {
		quiet: options.quiet ?? false,
		json: options.json ?? false,

		success(message: string) {
			if (options.quiet || options.json) return;
			console.log(isTTY ? pc.green(`✓ ${message}`) : `OK: ${message}`);
		},

		warn(message: string) {
			if (options.json) return;
			// Warnings go to stderr per CONTEXT.md (ATS warning)
			console.warn(isTTY ? pc.yellow(`⚠ ${message}`) : `WARN: ${message}`);
		},

		error(message: string) {
			if (options.json) {
				console.error(JSON.stringify({ error: message }));
			} else {
				console.error(isTTY ? pc.red(`✗ ${message}`) : `ERROR: ${message}`);
			}
		},

		info(message: string) {
			if (options.quiet || options.json) return;
			console.log(isTTY ? pc.cyan(message) : message);
		},
	};
}

export interface JsonOutput {
	status: 'success' | 'error';
	files?: Array<{ path: string; bytes: number; overwritten: boolean }>;
	errors?: Array<{ code: number; message: string; line?: number }>;
	warnings?: string[];
}

export function outputJson(result: JsonOutput): void {
	console.log(JSON.stringify(result, null, 2));
}
