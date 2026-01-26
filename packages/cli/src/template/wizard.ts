/**
 * Template wizard for creating customized templates.
 * Guides users through base selection, customization, and file generation.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	type DiscoveredTemplate,
	discoverTemplates,
} from '@gottz/cv-templates';
import { confirm, input, select } from '@inquirer/prompts';
import pc from 'picocolors';

import { validateTemplateId } from './constants.ts';
import { copyTemplate, formatTemplateName } from './copier.ts';
import {
	selectAccentColor,
	selectFonts,
	selectMargins,
	selectVisibleSections,
} from './prompts/index.ts';
import type { SectionVisibility, TemplateCustomization } from './types.ts';
import { validateTemplate } from './validator.ts';

/**
 * Prompt user to select base template to customize.
 * Shows only public templates (non-private).
 * Note: discoverTemplates already filters out private templates.
 * @param templates - Available templates
 * @returns Selected template ID
 */
export async function selectBaseTemplate(
	templates: DiscoveredTemplate[],
): Promise<string> {
	if (templates.length === 0) {
		throw new Error('No templates available to customize');
	}

	const choices = templates.map((t) => ({
		value: t.id,
		name: `${t.config.name} - ${t.config.description}`,
	}));

	return select({
		message: 'Select base template to customize:',
		choices,
		default: templates[0]?.id,
	});
}

/**
 * Prompt user for new template name.
 * Validates against reserved names and existing templates.
 * @param existingIds - IDs of existing templates
 * @returns New template ID (kebab-case)
 */
async function promptTemplateName(existingIds: string[]): Promise<string> {
	return input({
		message: 'New template name (kebab-case, e.g., my-custom):',
		validate: (value) => {
			const trimmed = value
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '-');

			// Check reserved names
			const reservedCheck = validateTemplateId(trimmed);
			if (reservedCheck !== true) {
				return reservedCheck;
			}

			// Check existing templates
			if (existingIds.includes(trimmed)) {
				return `Template "${trimmed}" already exists. Choose a different name.`;
			}

			return true;
		},
		transformer: (value) => {
			return value
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '-');
		},
	});
}

/**
 * Apply customizations to copied template.
 * Updates config.json with new style settings.
 * @param targetId - Target template ID
 * @param templatesDir - Templates directory path
 * @param customization - Style customizations
 * @param sections - Section visibility settings
 */
export async function applyCustomizations(
	targetId: string,
	templatesDir: string,
	customization: TemplateCustomization,
	sections: SectionVisibility,
): Promise<void> {
	const configPath = path.join(templatesDir, targetId, 'config.json');

	// Read current config
	const configContent = await readFile(configPath, 'utf-8');
	const config = JSON.parse(configContent) as Record<string, unknown>;

	// Build style object
	const style: Record<string, unknown> = {
		...(config.style as Record<string, unknown> | undefined),
	};

	if (customization.accentColor) {
		style.accentColor = customization.accentColor;
	}
	if (customization.fontHeading) {
		style.fontHeading = customization.fontHeading;
	}
	if (customization.fontBody) {
		style.fontBody = customization.fontBody;
	}
	if (customization.margins) {
		style.margins = customization.margins;
	}

	config.style = style;

	// Add section visibility config
	config.sections = {
		showSummary: sections.showSummary,
		showProjects: sections.showProjects,
		showCertifications: sections.showCertifications,
	};

	// Write updated config
	await writeFile(configPath, JSON.stringify(config, null, '\t'), 'utf-8');
}

/**
 * Format section visibility for display.
 */
function formatSections(sections: SectionVisibility): string {
	const visible: string[] = [];
	if (sections.showSummary) visible.push('Summary');
	if (sections.showProjects) visible.push('Projects');
	if (sections.showCertifications) visible.push('Certifications');

	if (visible.length === 3) {
		return 'All optional sections';
	}
	if (visible.length === 0) {
		return 'Core sections only';
	}
	return visible.join(', ');
}

/**
 * Run the template wizard.
 * Guides user through: base selection -> naming -> customization -> generation.
 * @param templatesDir - Templates directory path
 */
export async function runTemplateWizard(templatesDir: string): Promise<void> {
	console.log(pc.cyan('\n  Template Wizard'));
	console.log(pc.dim('  Create a customized CV template\n'));

	// 1. Discover available templates
	const templates = await discoverTemplates(templatesDir);
	const existingIds = templates.map((t) => t.id);

	// 2. Select base template (TPL-07)
	const baseId = await selectBaseTemplate(templates);
	console.log(pc.dim(`  Base: ${baseId}`));

	// 3. Name new template
	const targetId = await promptTemplateName(existingIds);
	console.log(pc.dim(`  Name: ${targetId}`));

	// 4. Customize colors (TPL-02)
	console.log(pc.dim('\n  Customize appearance:'));
	const accentColor = await selectAccentColor();

	// 5. Customize fonts (TPL-03)
	const { fontHeading, fontBody } = await selectFonts();

	// 6. Customize margins (TPL-04)
	const margins = await selectMargins();

	// 7. Section visibility (TPL-08)
	console.log(pc.dim('\n  Section visibility:'));
	const sections = await selectVisibleSections();

	// 8. Confirm before proceeding
	console.log(pc.dim('\n  Summary:'));
	console.log(`    Base template:   ${baseId}`);
	console.log(`    New name:        ${formatTemplateName(targetId)}`);
	console.log(`    Accent color:    ${accentColor}`);
	console.log(`    Heading font:    ${fontHeading.split(',')[0]?.trim()}`);
	console.log(`    Body font:       ${fontBody.split(',')[0]?.trim()}`);
	console.log(`    Margins:         ${margins}`);
	console.log(`    Sections:        ${formatSections(sections)}`);
	console.log('');

	const proceed = await confirm({
		message: 'Create template with these settings?',
		default: true,
	});

	if (!proceed) {
		console.log(pc.yellow('\n  Template creation cancelled.'));
		return;
	}

	// 9. Copy base and apply customizations (TPL-09)
	console.log(pc.dim('\n  Creating template...'));
	await copyTemplate(baseId, targetId, templatesDir);
	await applyCustomizations(
		targetId,
		templatesDir,
		{ accentColor, fontHeading, fontBody, margins },
		sections,
	);

	// 10. Validate result
	const result = await validateTemplate(targetId, templatesDir);
	if (!result.valid) {
		console.log(pc.yellow('\n  Warning: Generated template has issues:'));
		for (const error of result.errors) {
			console.log(pc.yellow(`    - ${error}`));
		}
	}

	for (const warning of result.warnings) {
		console.log(pc.yellow(`  Warning: ${warning}`));
	}

	// 11. Success message
	const targetPath = path.join(templatesDir, targetId);
	console.log(pc.green(`\n  Template created at ${targetPath}/`));
	console.log(
		pc.dim(`  Use with: cvgen build <name> --template ${targetId}\n`),
	);
}
