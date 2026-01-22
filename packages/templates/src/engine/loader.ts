import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { DiscoveredTemplate, TemplateConfig } from '../types.ts';

/**
 * Discover all templates in a directory.
 * Scans for subdirectories containing config.json.
 * Per CONTEXT.md: Malformed config.json causes fail fast.
 */
export async function discoverTemplates(
	templatesDir: string,
): Promise<DiscoveredTemplate[]> {
	const templates: DiscoveredTemplate[] = [];
	const entries = await readdir(templatesDir, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const configPath = path.join(templatesDir, entry.name, 'config.json');
		try {
			const configContent = await readFile(configPath, 'utf-8');
			const config = JSON.parse(configContent) as TemplateConfig;

			// Validate required fields
			if (!config.name || !config.description) {
				throw new Error(
					`Template ${entry.name}: config.json missing required fields (name, description)`,
				);
			}

			templates.push({
				id: entry.name,
				config,
				templatePath: path.join(entry.name, 'template.njk'),
				stylesPath: path.join(templatesDir, entry.name, 'styles.css'),
			});
		} catch (error) {
			// Per CONTEXT.md: Malformed config.json causes fail fast
			if (error instanceof SyntaxError) {
				throw new Error(
					`Template ${entry.name}: Invalid JSON in config.json - ${error.message}`,
				);
			}
			// Re-throw validation errors
			if (error instanceof Error && error.message.includes('config.json')) {
				throw error;
			}
		}
	}

	return templates;
}

/**
 * Get a specific template by ID.
 * Throws if template not found.
 */
export async function getTemplate(
	templatesDir: string,
	templateId: string,
): Promise<DiscoveredTemplate> {
	const templates = await discoverTemplates(templatesDir);
	const template = templates.find((t) => t.id === templateId);

	if (!template) {
		const available = templates.map((t) => t.id).join(', ');
		throw new Error(
			`Template "${templateId}" not found. Available: ${available || 'none'}`,
		);
	}

	return template;
}
