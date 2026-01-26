/**
 * TDD tests for template copy operations.
 * Tests copyTemplate and formatTemplateName functions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { copyTemplate, formatTemplateName } from '../copier.ts';

describe('copier', () => {
	const testDir = `/tmp/copier-test-${Date.now()}`;
	const templatesDir = path.join(testDir, 'templates');

	// Create test template structure before each test
	beforeEach(async () => {
		await mkdir(templatesDir, { recursive: true });

		// Create "modern" source template
		const modernDir = path.join(templatesDir, 'modern');
		await mkdir(modernDir, { recursive: true });

		// Create config.json
		const config = {
			name: 'Modern',
			description: 'A modern template',
			atsCompliant: true,
			style: {
				accentColor: '#2563eb',
			},
		};
		await writeFile(
			path.join(modernDir, 'config.json'),
			JSON.stringify(config, null, '\t'),
			'utf-8',
		);

		// Create template.njk
		await writeFile(
			path.join(modernDir, 'template.njk'),
			'<div>Template content</div>',
			'utf-8',
		);

		// Create styles.css
		await writeFile(
			path.join(modernDir, 'styles.css'),
			'.cv { color: blue; }',
			'utf-8',
		);

		// Create a private template for testing private flag removal
		const privateDir = path.join(templatesDir, 'private-template');
		await mkdir(privateDir, { recursive: true });

		const privateConfig = {
			name: 'Private',
			description: 'A private template',
			private: true,
		};
		await writeFile(
			path.join(privateDir, 'config.json'),
			JSON.stringify(privateConfig, null, '\t'),
			'utf-8',
		);
		await writeFile(
			path.join(privateDir, 'template.njk'),
			'<div>Private</div>',
			'utf-8',
		);
		await writeFile(
			path.join(privateDir, 'styles.css'),
			'.private { }',
			'utf-8',
		);
	});

	// Clean up test directory after each test
	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe('formatTemplateName', () => {
		it('converts kebab-case to Title Case', () => {
			expect(formatTemplateName('my-custom')).toBe('My Custom');
		});

		it('handles multiple words', () => {
			expect(formatTemplateName('my-test-template')).toBe('My Test Template');
		});

		it('handles single word', () => {
			expect(formatTemplateName('modern')).toBe('Modern');
		});

		it('handles already capitalized input', () => {
			expect(formatTemplateName('My-Custom')).toBe('My Custom');
		});

		it('handles empty string', () => {
			expect(formatTemplateName('')).toBe('');
		});
	});

	describe('copyTemplate', () => {
		it('creates exact replica of source directory structure', async () => {
			await copyTemplate('modern', 'my-custom', templatesDir);

			// Check target directory exists
			const targetDir = path.join(templatesDir, 'my-custom');
			const entries = await readdir(targetDir);

			expect(entries).toContain('config.json');
			expect(entries).toContain('template.njk');
			expect(entries).toContain('styles.css');
		});

		it('copies file contents correctly', async () => {
			await copyTemplate('modern', 'my-custom', templatesDir);

			const targetDir = path.join(templatesDir, 'my-custom');

			// Check template.njk content
			const templateContent = await readFile(
				path.join(targetDir, 'template.njk'),
				'utf-8',
			);
			expect(templateContent).toBe('<div>Template content</div>');

			// Check styles.css content
			const stylesContent = await readFile(
				path.join(targetDir, 'styles.css'),
				'utf-8',
			);
			expect(stylesContent).toBe('.cv { color: blue; }');
		});

		it('updates config.json name field to match target', async () => {
			await copyTemplate('modern', 'my-custom', templatesDir);

			const configPath = path.join(templatesDir, 'my-custom', 'config.json');
			const config = JSON.parse(await readFile(configPath, 'utf-8'));

			expect(config.name).toBe('My Custom');
		});

		it('preserves other config.json fields', async () => {
			await copyTemplate('modern', 'my-custom', templatesDir);

			const configPath = path.join(templatesDir, 'my-custom', 'config.json');
			const config = JSON.parse(await readFile(configPath, 'utf-8'));

			expect(config.description).toBe('A modern template');
			expect(config.atsCompliant).toBe(true);
			expect(config.style.accentColor).toBe('#2563eb');
		});

		it('removes private flag from copied template', async () => {
			await copyTemplate('private-template', 'my-public', templatesDir);

			const configPath = path.join(templatesDir, 'my-public', 'config.json');
			const config = JSON.parse(await readFile(configPath, 'utf-8'));

			expect(config.private).toBeUndefined();
			expect(config.name).toBe('My Public');
		});

		it('throws error if target already exists', async () => {
			// Create existing target
			const existingDir = path.join(templatesDir, 'existing');
			await mkdir(existingDir, { recursive: true });
			await writeFile(path.join(existingDir, 'config.json'), '{}', 'utf-8');

			await expect(
				copyTemplate('modern', 'existing', templatesDir),
			).rejects.toThrow();
		});

		it('throws error if source does not exist', async () => {
			await expect(
				copyTemplate('nonexistent', 'my-new', templatesDir),
			).rejects.toThrow();
		});

		it('handles multi-word template names correctly', async () => {
			await copyTemplate('modern', 'my-test-template', templatesDir);

			const configPath = path.join(
				templatesDir,
				'my-test-template',
				'config.json',
			);
			const config = JSON.parse(await readFile(configPath, 'utf-8'));

			expect(config.name).toBe('My Test Template');
		});
	});
});
