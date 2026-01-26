/**
 * Template copy operations.
 * Provides copyTemplate for creating template copies and formatTemplateName for name formatting.
 */

// biome-ignore lint/correctness/noUnusedImports: Used in implementation (TDD stub)
import { cp, readFile, writeFile } from 'node:fs/promises';
// biome-ignore lint/correctness/noUnusedImports: Used in implementation (TDD stub)
import path from 'node:path';

/**
 * Format a kebab-case template ID to Title Case name.
 * "my-custom" -> "My Custom"
 * "my-test-template" -> "My Test Template"
 */
export function formatTemplateName(_templateId: string): string {
	// TODO: Implement
	throw new Error('Not implemented');
}

/**
 * Copy a template directory with automatic config.json name update.
 * - Creates exact replica of source directory structure
 * - Updates config.json name field to formatted target name
 * - Removes private flag from copied template
 * - Throws if target already exists (overwrite protection)
 */
export async function copyTemplate(
	_sourceId: string,
	_targetId: string,
	_templatesDir: string,
): Promise<void> {
	// TODO: Implement
	throw new Error('Not implemented');
}
