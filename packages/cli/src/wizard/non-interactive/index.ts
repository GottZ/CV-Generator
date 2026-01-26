/**
 * Non-interactive wizard mode module.
 * Provides JSON input validation, stdin reading, and schema export.
 */

// Flag collector
export type {
	AddCertificationFlagOptions,
	AddEducationFlagOptions,
	AddExperienceFlagOptions,
	AddProjectFlagOptions,
	AddSkillsFlagOptions,
	InitFlagOptions,
} from './flag-collector.ts';
export {
	buildCertificationFromFlags,
	buildContactFromFlags,
	buildEducationFromFlags,
	buildExperienceFromFlags,
	buildProjectFromFlags,
	buildSkillsFromFlags,
} from './flag-collector.ts';
// JSON input reading
export { parseJsonContent, readJsonInput } from './input-reader.ts';
// Mode detection
export type {
	WizardExecutionMode,
	WizardModeOptions,
} from './mode-detector.ts';
export {
	detectMode,
	ensureNonInteractiveRequirements,
} from './mode-detector.ts';
// Output formatting
export type { ErrorDetails, ExitCode } from './output-formatter.ts';
export {
	EXIT_CODES,
	exitWithError,
	output,
	progress,
} from './output-formatter.ts';
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

// State builder
export type { ConflictDetails } from './state-builder.ts';
export {
	buildWizardState,
	detectConflicts,
	hasMinimumData,
	mergeContactFlags,
} from './state-builder.ts';
