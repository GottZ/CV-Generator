import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CVData } from '@gottz/cv-core';
import {
	loadGlobalConfig,
	resolveStyle,
	styleToCssVariables,
} from './config/index.ts';
import { createTemplateEnvironment, getTemplate } from './engine/index.ts';
import type { RenderOptions, RenderResult } from './types.ts';

/**
 * Render a CV to HTML using the specified template.
 *
 * Per CONTEXT.md:
 * - Separate files per language (caller specifies locale)
 * - Missing translation: log warning, skip section (no fallback)
 */
export async function renderCV(
	cv: CVData,
	options: RenderOptions,
	templatesDir: string,
): Promise<RenderResult> {
	const { templateId, locale, styleConfig, projectRoot } = options;

	// Create Nunjucks environment
	const env = createTemplateEnvironment(templatesDir);

	// Get template metadata
	const template = await getTemplate(templatesDir, templateId);

	// Load CSS for inline embedding
	const baseCss = await readFile(template.stylesPath, 'utf-8');

	// Load shared print CSS (single source of truth - PRINT-02)
	const printCssPath = path.join(templatesDir, '_shared/partials/_print.css');
	const printCss = await readFile(printCssPath, 'utf-8');

	// Resolve style cascade: template defaults < global config < env vars < frontmatter
	const warnings: string[] = [];
	const globalConfig = projectRoot ? await loadGlobalConfig(projectRoot) : null;

	const resolvedStyle = resolveStyle(
		template.config,
		globalConfig,
		styleConfig,
		warnings,
	);

	// Log style resolution warnings
	for (const warning of warnings) {
		console.warn(`[cv-templates] Warning: ${warning}`);
	}

	// Prepend style overrides to CSS (so templates can use the variables)
	// Print CSS loaded AFTER template CSS for correct cascade order (PRINT-02)
	const styleOverrides = styleToCssVariables(resolvedStyle);
	const css = `${styleOverrides}\n\n${baseCss}\n\n${printCss}`;

	// Resolve localized content for this locale
	// Per CONTEXT.md: missing translation -> skip section (undefined in context)
	const context = {
		contact: cv.contact,
		photo: cv.contact.photo,
		summary: cv.summary?.[locale],
		experience: cv.experience?.[locale],
		education: cv.education?.[locale],
		skills: cv.skills?.[locale],
		// Phase 7 additions
		projects: cv.projects?.[locale],
		certifications: cv.certifications, // Not localized
		locale,
		css,
	};

	// Log warnings for missing translations
	logMissingTranslations(cv, locale);

	// Render template
	const html = env.render(template.templatePath, context);

	return { html, locale, templateId };
}

/**
 * Log warnings for sections that exist in CV but not for requested locale.
 */
function logMissingTranslations(cv: CVData, locale: string): void {
	const sections: Array<{
		name: string;
		data: Record<string, unknown> | undefined;
	}> = [
		{ name: 'summary', data: cv.summary },
		{ name: 'experience', data: cv.experience },
		{ name: 'education', data: cv.education },
		{ name: 'skills', data: cv.skills },
	];

	for (const section of sections) {
		if (
			section.data &&
			Object.keys(section.data).length > 0 &&
			!section.data[locale]
		) {
			const available = Object.keys(section.data).join(', ');
			console.warn(
				`[cv-templates] Warning: ${section.name} has no "${locale}" translation. Available: ${available}`,
			);
		}
	}
}

/**
 * Create a render function with pre-configured environment.
 * Useful when rendering multiple CVs with same template.
 */
export function createRenderer(templatesDir: string) {
	const env = createTemplateEnvironment(templatesDir);

	return async function render(
		cv: CVData,
		options: RenderOptions,
	): Promise<RenderResult> {
		const { templateId, locale, styleConfig, projectRoot } = options;
		const template = await getTemplate(templatesDir, templateId);
		const baseCss = await readFile(template.stylesPath, 'utf-8');

		// Load shared print CSS (single source of truth - PRINT-02)
		const printCssPath = path.join(templatesDir, '_shared/partials/_print.css');
		const printCss = await readFile(printCssPath, 'utf-8');

		// Resolve style cascade: template defaults < global config < env vars < frontmatter
		const warnings: string[] = [];
		const globalConfig = projectRoot
			? await loadGlobalConfig(projectRoot)
			: null;

		const resolvedStyle = resolveStyle(
			template.config,
			globalConfig,
			styleConfig,
			warnings,
		);

		// Log style resolution warnings
		for (const warning of warnings) {
			console.warn(`[cv-templates] Warning: ${warning}`);
		}

		// Prepend style overrides to CSS (so templates can use the variables)
		// Print CSS loaded AFTER template CSS for correct cascade order (PRINT-02)
		const styleOverrides = styleToCssVariables(resolvedStyle);
		const css = `${styleOverrides}\n\n${baseCss}\n\n${printCss}`;

		const context = {
			contact: cv.contact,
			photo: cv.contact.photo,
			summary: cv.summary?.[locale],
			experience: cv.experience?.[locale],
			education: cv.education?.[locale],
			skills: cv.skills?.[locale],
			// Phase 7 additions
			projects: cv.projects?.[locale],
			certifications: cv.certifications, // Not localized
			locale,
			css,
		};

		logMissingTranslations(cv, locale);
		const html = env.render(template.templatePath, context);

		return { html, locale, templateId };
	};
}
