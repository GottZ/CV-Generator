import nunjucks from 'nunjucks';
import { registerFilters } from './filters.ts';

export { registerFilters } from './filters.ts';
export { discoverTemplates, getTemplate } from './loader.ts';

/**
 * Create a configured Nunjucks environment.
 * Per RESEARCH.md Pattern 1: autoescape, FileSystemLoader, custom filters.
 */
export function createTemplateEnvironment(
	templatesDir: string,
): nunjucks.Environment {
	const loader = new nunjucks.FileSystemLoader(templatesDir, {
		watch: false, // No auto-reload in production
		noCache: false, // Cache compiled templates
	});

	const env = new nunjucks.Environment(loader, {
		autoescape: true, // Prevent XSS
		throwOnUndefined: false, // Missing vars -> empty string
		trimBlocks: true, // Remove first newline after block
		lstripBlocks: true, // Strip leading whitespace before blocks
	});

	// Register custom filters
	registerFilters(env);

	return env;
}
