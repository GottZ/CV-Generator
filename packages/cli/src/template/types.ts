/**
 * Template scaffolding type definitions.
 * Types for template copy, customize, and wizard operations.
 */

import type { StyleConfig } from '@gottz/cv-templates';

// Re-export StyleConfig for convenience
export type { StyleConfig };

/**
 * Result of template validation.
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Template customization options.
 * Matches StyleConfig from cv-templates but with wizard-friendly types.
 */
export interface TemplateCustomization {
	/** Accent color hex (e.g., "#2563eb") */
	accentColor?: string;
	/** Heading font stack */
	fontHeading?: string;
	/** Body font stack */
	fontBody?: string;
	/** Page margins (named or numeric mm) */
	margins?: 'narrow' | 'normal' | 'wide' | number;
}

/**
 * Section visibility configuration for templates.
 * Controls which optional sections appear in generated CVs.
 */
export interface SectionVisibility {
	showSummary: boolean;
	showProjects: boolean;
	showCertifications: boolean;
}

/**
 * Template wizard state tracking progress through customization.
 */
export interface TemplateWizardState {
	/** Base template ID to customize (e.g., "modern") */
	baseTemplate: string | null;
	/** Target template ID (e.g., "my-custom") */
	targetId: string | null;
	/** Style customizations */
	customization: TemplateCustomization;
	/** Section visibility settings */
	sections: SectionVisibility;
	/** Whether wizard has been confirmed */
	confirmed: boolean;
}

/**
 * Template copy options.
 */
export interface CopyOptions {
	/** Force overwrite if target exists */
	force?: boolean;
}

/**
 * Font option for select prompt.
 */
export interface FontOption {
	/** Font stack value (e.g., "Arial, Helvetica, sans-serif") */
	value: string;
	/** Display name (e.g., "Arial (recommended)") */
	name: string;
}

/**
 * Color preset for select prompt.
 */
export interface ColorPreset {
	/** Hex color value */
	value: string;
	/** Display name */
	name: string;
}
