/**
 * Zod schemas for non-interactive wizard JSON input validation.
 * Matches cv-core types but designed for JSON input with string dates.
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Link input schema (for contact links).
 */
export const LinkInputSchema = z.object({
	type: z.string().min(1, 'Link type is required'),
	url: z.string().url('Invalid URL format'),
	label: z.string().optional(),
});

/**
 * Contact input schema.
 * Name is required, all other fields optional.
 */
export const ContactInputSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().optional(),
	location: z.string().optional(),
	links: z.array(LinkInputSchema).optional(),
});

// ============================================================================
// STAR Bullet Support
// ============================================================================

/**
 * STAR bullet object for structured input.
 * Situation/Task/Action/Result method for achievement bullets.
 */
export const StarBulletSchema = z.object({
	situation: z.string().optional(),
	task: z.string().optional(),
	action: z.string().min(1, 'Action is required in STAR format'),
	result: z.string().optional(),
});

/**
 * Bullet input - supports plain string OR STAR object.
 * Auto-detected at runtime based on type.
 */
export const BulletInputSchema = z.union([z.string().min(1), StarBulletSchema]);

// Type exports
export type StarBullet = z.infer<typeof StarBulletSchema>;
export type BulletInput = z.infer<typeof BulletInputSchema>;

/**
 * Convert STAR object to bullet string.
 */
export function starToBullet(star: StarBullet): string {
	const parts: string[] = [];
	if (star.situation) parts.push(star.situation);
	if (star.task) parts.push(star.task);
	parts.push(star.action);
	if (star.result) parts.push(star.result);
	return parts.join(' ');
}

/**
 * Normalize bullet input to string.
 */
export function normalizeBullet(input: BulletInput): string {
	if (typeof input === 'string') return input;
	return starToBullet(input);
}

// ============================================================================
// Section Schemas
// ============================================================================

/**
 * Date regex pattern for YYYY-MM or YYYY-MM-DD format.
 */
const datePattern = /^\d{4}-\d{1,2}(-\d{1,2})?$/;

/**
 * Experience input schema.
 */
export const ExperienceInputSchema = z.object({
	company: z.string().min(1, 'Company is required'),
	role: z.string().min(1, 'Role is required'),
	startDate: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format'),
	endDate: z.string().default('present'),
	location: z.string().optional(),
	bullets: z.array(BulletInputSchema).min(1, 'At least one bullet is required'),
	techStack: z.array(z.string()).optional(),
});

/**
 * Education input schema.
 */
export const EducationInputSchema = z.object({
	institution: z.string().min(1, 'Institution is required'),
	degree: z.string().min(1, 'Degree is required'),
	field: z.string().optional(),
	startDate: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format'),
	endDate: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format'),
	location: z.string().optional(),
	honors: z.string().optional(),
	notes: z.string().optional(),
});

/**
 * Skill input schema.
 */
export const SkillInputSchema = z.object({
	name: z.string().min(1, 'Skill name is required'),
	level: z.string().optional(),
});

/**
 * Skill category input schema.
 */
export const SkillCategoryInputSchema = z.object({
	name: z.string().min(1, 'Category name is required'),
	skills: z.array(SkillInputSchema).min(1, 'At least one skill is required'),
});

/**
 * Project link input schema.
 */
export const ProjectLinkInputSchema = z.object({
	url: z.string().url('Invalid URL format'),
	type: z.string().optional(),
	label: z.string().optional(),
});

/**
 * Project input schema.
 * Name is required, all other fields optional per cv-core.
 */
export const ProjectInputSchema = z.object({
	name: z.string().min(1, 'Project name is required'),
	description: z.string().optional(),
	techStack: z.array(z.string()).optional(),
	links: z.array(ProjectLinkInputSchema).optional(),
	outcome: z.string().optional(),
	role: z.string().optional(),
	type: z
		.enum(['personal', 'professional', 'open-source', 'freelance'])
		.optional(),
	startDate: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format')
		.optional(),
	endDate: z.string().optional(),
	highlight: z.boolean().optional(),
});

/**
 * Certification input schema.
 * Name, issuer, date required per cv-core.
 */
export const CertificationInputSchema = z.object({
	name: z.string().min(1, 'Certification name is required'),
	issuer: z.string().min(1, 'Issuer is required'),
	date: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format'),
	expiryDate: z
		.string()
		.regex(datePattern, 'Date must be YYYY-MM or YYYY-MM-DD format')
		.optional(),
	verificationUrl: z.string().url('Invalid URL format').optional(),
	credentialId: z.string().optional(),
});

// ============================================================================
// Full Wizard Input Schemas
// ============================================================================

/**
 * Full wizard init input schema.
 * Only contact is required; all other sections optional.
 */
export const WizardInitInputSchema = z.object({
	contact: ContactInputSchema,
	experience: z.array(ExperienceInputSchema).optional(),
	education: z.array(EducationInputSchema).optional(),
	skills: z.array(SkillCategoryInputSchema).optional(),
	projects: z.array(ProjectInputSchema).optional(),
	certifications: z.array(CertificationInputSchema).optional(),
});

// ============================================================================
// Add Section Schemas (for add commands)
// ============================================================================

/**
 * Add experience input - array for bulk operations.
 */
export const AddExperienceInputSchema = z.object({
	experience: z
		.array(ExperienceInputSchema)
		.min(1, 'At least one experience entry is required'),
});

/**
 * Add education input - array for bulk operations.
 */
export const AddEducationInputSchema = z.object({
	education: z
		.array(EducationInputSchema)
		.min(1, 'At least one education entry is required'),
});

/**
 * Add skills input - array for bulk operations.
 */
export const AddSkillsInputSchema = z.object({
	skills: z
		.array(SkillCategoryInputSchema)
		.min(1, 'At least one skill category is required'),
});

/**
 * Add project input - array for bulk operations.
 */
export const AddProjectInputSchema = z.object({
	projects: z
		.array(ProjectInputSchema)
		.min(1, 'At least one project is required'),
});

/**
 * Add certification input - array for bulk operations.
 */
export const AddCertificationInputSchema = z.object({
	certifications: z
		.array(CertificationInputSchema)
		.min(1, 'At least one certification is required'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ContactInput = z.infer<typeof ContactInputSchema>;
export type ExperienceInput = z.infer<typeof ExperienceInputSchema>;
export type EducationInput = z.infer<typeof EducationInputSchema>;
export type SkillInput = z.infer<typeof SkillInputSchema>;
export type SkillCategoryInput = z.infer<typeof SkillCategoryInputSchema>;
export type ProjectInput = z.infer<typeof ProjectInputSchema>;
export type CertificationInput = z.infer<typeof CertificationInputSchema>;
export type WizardInitInput = z.infer<typeof WizardInitInputSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validation error structure for JSON output.
 */
export interface ValidationError {
	error: string;
	details: z.ZodFormattedError<unknown>;
}

/**
 * Validate wizard input against a schema.
 * Returns validated data or throws with structured error.
 *
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @param jsonOutput - If true, format errors as JSON; if false, throw with message
 * @returns Validated and typed data
 * @throws Error with validation details
 */
export function validateWizardInput<T extends z.ZodType>(
	schema: T,
	data: unknown,
	jsonOutput: boolean,
): z.infer<T> {
	const result = schema.safeParse(data);

	if (!result.success) {
		const formatted = result.error.format();

		if (jsonOutput) {
			const errorObj: ValidationError = {
				error: 'Validation failed',
				details: formatted,
			};
			// Throw with JSON string for caller to handle
			throw new Error(JSON.stringify(errorObj, null, 2));
		}

		// Human-readable error
		throw new Error(`Validation failed:\n${result.error.message}`);
	}

	return result.data;
}
