/**
 * TDD tests for template validation operations.
 * Tests validateTemplate function and ValidationResult structure.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateTemplate } from '../validator.ts';

describe('validator', () => {
	const testDir = `/tmp/validator-test-${Date.now()}`;
	const templatesDir = path.join(testDir, 'templates');

	// Create test template structure before each test
	beforeEach(async () => {
		await mkdir(templatesDir, { recursive: true });
	});

	// Clean up test directory after each test
	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	/**
	 * Helper to create a template with specified files.
	 */
	async function createTemplate(
		id: string,
		files: Record<string, string>,
	): Promise<void> {
		const templateDir = path.join(templatesDir, id);
		await mkdir(templateDir, { recursive: true });

		for (const [filename, content] of Object.entries(files)) {
			await writeFile(path.join(templateDir, filename), content, 'utf-8');
		}
	}

	describe('validateTemplate', () => {
		it('returns valid for template with all required files', async () => {
			await createTemplate('valid-template', {
				'config.json': JSON.stringify({
					name: 'Valid Template',
					description: 'A valid template',
				}),
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('valid-template', templatesDir);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.warnings).toEqual([]);
		});

		it('returns error for missing config.json', async () => {
			await createTemplate('missing-config', {
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('missing-config', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Missing required file: config.json');
		});

		it('returns error for missing template.njk', async () => {
			await createTemplate('missing-template', {
				'config.json': JSON.stringify({
					name: 'Test',
					description: 'Test',
				}),
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('missing-template', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Missing required file: template.njk');
		});

		it('returns error for missing styles.css', async () => {
			await createTemplate('missing-styles', {
				'config.json': JSON.stringify({
					name: 'Test',
					description: 'Test',
				}),
				'template.njk': '<div>Template</div>',
			});

			const result = await validateTemplate('missing-styles', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Missing required file: styles.css');
		});

		it('returns error for invalid JSON in config.json', async () => {
			await createTemplate('invalid-json', {
				'config.json': '{ invalid json }',
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('invalid-json', templatesDir);

			expect(result.valid).toBe(false);
			expect(
				result.errors.some((e) => e.includes('config.json: invalid JSON')),
			).toBe(true);
		});

		it('returns error for config.json missing name field', async () => {
			await createTemplate('missing-name', {
				'config.json': JSON.stringify({
					description: 'Missing name',
				}),
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('missing-name', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('config.json: missing "name" field');
		});

		it('returns error for config.json missing description field', async () => {
			await createTemplate('missing-description', {
				'config.json': JSON.stringify({
					name: 'Missing Description',
				}),
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate(
				'missing-description',
				templatesDir,
			);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'config.json: missing "description" field',
			);
		});

		it('returns warning for invalid hex color in style.accentColor', async () => {
			await createTemplate('invalid-color', {
				'config.json': JSON.stringify({
					name: 'Invalid Color',
					description: 'Has invalid color',
					style: {
						accentColor: 'not-a-color',
					},
				}),
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('invalid-color', templatesDir);

			// Template should still be valid (warning, not error)
			expect(result.valid).toBe(true);
			expect(result.warnings.some((w) => w.includes('accentColor'))).toBe(true);
		});

		it('accepts valid hex color in style.accentColor', async () => {
			await createTemplate('valid-color', {
				'config.json': JSON.stringify({
					name: 'Valid Color',
					description: 'Has valid color',
					style: {
						accentColor: '#2563eb',
					},
				}),
				'template.njk': '<div>Template</div>',
				'styles.css': '.cv { }',
			});

			const result = await validateTemplate('valid-color', templatesDir);

			expect(result.valid).toBe(true);
			expect(result.warnings).toEqual([]);
		});

		it('returns error for non-existent template directory', async () => {
			const result = await validateTemplate('nonexistent', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Template directory not found: nonexistent',
			);
		});

		it('returns multiple errors when multiple issues exist', async () => {
			await createTemplate('multiple-issues', {
				'config.json': JSON.stringify({
					// Missing both name and description
				}),
				// Missing template.njk and styles.css
			});

			const result = await validateTemplate('multiple-issues', templatesDir);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
			expect(result.errors).toContain('Missing required file: template.njk');
			expect(result.errors).toContain('Missing required file: styles.css');
			expect(result.errors).toContain('config.json: missing "name" field');
			expect(result.errors).toContain(
				'config.json: missing "description" field',
			);
		});
	});
});
