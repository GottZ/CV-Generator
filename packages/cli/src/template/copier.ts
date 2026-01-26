/**
 * Template copy operations.
 * Provides copyTemplate for creating template copies and formatTemplateName for name formatting.
 */

import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Format a kebab-case template ID to Title Case name.
 * "my-custom" -> "My Custom"
 * "my-test-template" -> "My Test Template"
 */
export function formatTemplateName(templateId: string): string {
	if (!templateId) return '';
	return templateId
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Copy a template directory with automatic config.json name update.
 * - Creates exact replica of source directory structure
 * - Updates config.json name field to formatted target name
 * - Removes private flag from copied template
 * - Throws if target already exists (overwrite protection)
 */
export async function copyTemplate(
	sourceId: string,
	targetId: string,
	templatesDir: string,
): Promise<void> {
	const sourcePath = path.join(templatesDir, sourceId);
	const targetPath = path.join(templatesDir, targetId);

	// Recursive copy with overwrite protection
	await cp(sourcePath, targetPath, {
		recursive: true,
		errorOnExist: true,
		force: false,
	});

	// Update config.json with new name and remove private flag
	const configPath = path.join(targetPath, 'config.json');
	const config = JSON.parse(await readFile(configPath, 'utf-8'));
	config.name = formatTemplateName(targetId);
	delete config.private;
	await writeFile(configPath, JSON.stringify(config, null, '\t'), 'utf-8');
}
