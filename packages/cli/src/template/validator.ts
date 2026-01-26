/**
 * Template validation operations.
 * Validates template structure and config.json schema.
 */

import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isValidHexColor } from '@gottz/cv-templates';

/** Required files for a valid template */
const REQUIRED_FILES = ['config.json', 'template.njk', 'styles.css'];

/**
 * Result of template validation.
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Validate a template directory structure and configuration.
 * Checks for:
 * - Required files: config.json, template.njk, styles.css
 * - Valid JSON in config.json
 * - Required fields in config.json: name, description
 * - Valid color values in style configuration (warnings only)
 */
export async function validateTemplate(
	templateId: string,
	templatesDir: string,
): Promise<ValidationResult> {
	const errors: string[] = [];
	const warnings: string[] = [];
	const templateDir = path.join(templatesDir, templateId);

	// Check if template directory exists
	try {
		const stats = await stat(templateDir);
		if (!stats.isDirectory()) {
			return {
				valid: false,
				errors: [`Template directory not found: ${templateId}`],
				warnings: [],
			};
		}
	} catch {
		return {
			valid: false,
			errors: [`Template directory not found: ${templateId}`],
			warnings: [],
		};
	}

	// Check for required files
	for (const file of REQUIRED_FILES) {
		const filePath = path.join(templateDir, file);
		try {
			await access(filePath);
		} catch {
			errors.push(`Missing required file: ${file}`);
		}
	}

	// Validate config.json if it exists
	const configPath = path.join(templateDir, 'config.json');
	try {
		const configContent = await readFile(configPath, 'utf-8');
		try {
			const config = JSON.parse(configContent);

			// Check required fields
			if (!config.name) {
				errors.push('config.json: missing "name" field');
			}
			if (!config.description) {
				errors.push('config.json: missing "description" field');
			}

			// Validate style colors (warnings only - template still works)
			if (config.style?.accentColor) {
				if (!isValidHexColor(config.style.accentColor)) {
					warnings.push(
						`config.json: invalid hex color for accentColor: "${config.style.accentColor}"`,
					);
				}
			}
		} catch (parseError) {
			if (parseError instanceof SyntaxError) {
				errors.push(`config.json: invalid JSON - ${parseError.message}`);
			}
		}
	} catch {
		// config.json doesn't exist - already handled in required files check
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}
