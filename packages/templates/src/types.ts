/**
 * Template configuration from config.json.
 * Per CONTEXT.md: minimal config with ATS compliance metadata.
 */
export interface TemplateConfig {
	/** Display name of the template */
	name: string;
	/** Brief description of the template style */
	description: string;
	/** Whether template follows ATS optimization rules */
	atsCompliant?: boolean;
	/** Whether template uses single-column layout */
	singleColumn?: boolean;
	/** Optional section header overrides per locale */
	sectionHeaders?: {
		[locale: string]: {
			[section: string]: string;
		};
	};
	/** Optional preview image filename */
	preview?: string;
}

/**
 * Discovered template with resolved paths.
 */
export interface DiscoveredTemplate {
	/** Directory name (kebab-case identifier) */
	id: string;
	/** Parsed config.json */
	config: TemplateConfig;
	/** Relative path to template.njk from templates root */
	templatePath: string;
	/** Absolute path to styles.css */
	stylesPath: string;
}

/**
 * Options for rendering a CV.
 */
export interface RenderOptions {
	/** Template ID (directory name) to use */
	templateId: string;
	/** Locale code for section headers and date formatting */
	locale: string;
}

/**
 * Result of rendering a CV to HTML.
 */
export interface RenderResult {
	/** Rendered HTML string */
	html: string;
	/** Locale used for rendering */
	locale: string;
	/** Template ID used for rendering */
	templateId: string;
}
