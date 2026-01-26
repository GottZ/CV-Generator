/**
 * Non-interactive wizard mode module.
 * Provides JSON input validation, stdin reading, and schema export.
 */

// JSON input reading
export { parseJsonContent, readJsonInput } from './input-reader.ts';
// Mode detection
export type { WizardModeOptions } from './mode-detector.ts';
export {
	detectMode,
	ensureNonInteractiveRequirements,
} from './mode-detector.ts';

// Schema export
export type { SchemaCommand } from './schema-export.ts';
export {
	getAvailableSchemas,
	getJsonSchema,
	hasSchema,
	showJsonSchema,
} from './schema-export.ts';
// Type exports
export type {
	BulletInput,
	CertificationInput,
	ContactInput,
	EducationInput,
	ExperienceInput,
	ProjectInput,
	SkillCategoryInput,
	SkillInput,
	StarBullet,
	ValidationError,
	WizardInitInput,
} from './schemas.ts';
// Schemas and validation
export {
	// Add section schemas
	AddCertificationInputSchema,
	AddEducationInputSchema,
	AddExperienceInputSchema,
	AddProjectInputSchema,
	AddSkillsInputSchema,
	// STAR bullet support
	BulletInputSchema,
	// Section schemas
	CertificationInputSchema,
	// Base schemas
	ContactInputSchema,
	EducationInputSchema,
	ExperienceInputSchema,
	LinkInputSchema,
	normalizeBullet,
	ProjectInputSchema,
	ProjectLinkInputSchema,
	SkillCategoryInputSchema,
	SkillInputSchema,
	StarBulletSchema,
	starToBullet,
	// Validation helper
	validateWizardInput,
	// Full wizard schemas
	WizardInitInputSchema,
} from './schemas.ts';
