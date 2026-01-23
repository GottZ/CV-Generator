import path from 'node:path';
import { discoverTemplates } from '@gottz/cv-templates';
import Table from 'cli-table3';
import { createConsole, outputJson } from '../lib/console.ts';

export interface ListTemplatesOptions {
	json?: boolean;
	quiet?: boolean;
}

/**
 * List templates command action - show available templates.
 */
export async function listTemplatesAction(
	options: ListTemplatesOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();
	const templatesDir = path.join(cwd, 'templates');

	// Discover templates
	const templates = await discoverTemplates(templatesDir);

	// Handle no templates found
	if (templates.length === 0) {
		if (options.json) {
			outputJson({ status: 'success', files: [] });
			return;
		}

		cons.warn('No templates found in templates/');
		cons.info('\nTry: Check that templates/ directory exists');
		return;
	}

	// JSON output mode
	if (options.json) {
		const output = {
			status: 'success' as const,
			templates: templates.map((t) => ({
				id: t.id,
				name: t.config.name,
				description: t.config.description,
				atsCompliant: t.config.atsCompliant ?? false,
			})),
		};
		console.log(JSON.stringify(output, null, 2));
		return;
	}

	// Build table per CONTEXT.md and RESEARCH.md Pattern 3
	const table = new Table({
		head: ['Name', 'Description', 'ATS Compliant'],
		style: { head: ['cyan'] },
	});

	for (const t of templates) {
		table.push([
			t.id,
			t.config.description ?? '',
			t.config.atsCompliant ? 'Yes' : 'No',
		]);
	}

	// Output table and count
	console.log(table.toString());
	cons.info(`\n${templates.length} template(s) available`);
}
