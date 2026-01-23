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
	/** Hide template from list-templates command (default false) */
	private?: boolean;
	/** Minimum cvgen version required for this template */
	minVersion?: string;
	/** Optional section header overrides per locale */
	sectionHeaders?: {
		[locale: string]: {
			[section: string]: string;
		};
	};
	/** Optional preview image filename */
	preview?: string;
	/** Style configuration for template customization */
	style?: {
		/** Primary accent color (hex format) */
		accentColor?: string;
		/** Heading font family */
		fontHeading?: string;
		/** Body text font family */
		fontBody?: string;
		/** Page margins: "narrow" | "normal" | "wide" or number (mm) */
		margins?: string | number;
		/** Color palette overrides */
		colors?: {
			heading?: string;
			body?: string;
			muted?: string;
			border?: string;
			background?: string;
		};
	};
	/** Locale-specific configuration */
	locales?: {
		[locale: string]: {
			/** dayjs format string for dates */
			dateFormat?: string;
		};
	};
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
