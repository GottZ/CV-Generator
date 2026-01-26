/**
 * JSON Schema export for wizard input documentation.
 * Uses Zod 4's native z.toJSONSchema() for schema generation.
 */

import { z } from 'zod';
import {
	AddCertificationInputSchema,
	AddEducationInputSchema,
	AddExperienceInputSchema,
	AddProjectInputSchema,
	AddSkillsInputSchema,
	WizardInitInputSchema,
} from './schemas.ts';

/**
 * Wizard commands that support JSON input.
 */
export type SchemaCommand =
	| 'init'
	| 'add-experience'
	| 'add-education'
	| 'add-skills'
	| 'add-project'
	| 'add-certification';

/**
 * Map of command names to their Zod schemas.
 */
const schemas: Record<SchemaCommand, z.ZodType> = {
	init: WizardInitInputSchema,
	'add-experience': AddExperienceInputSchema,
	'add-education': AddEducationInputSchema,
	'add-skills': AddSkillsInputSchema,
	'add-project': AddProjectInputSchema,
	'add-certification': AddCertificationInputSchema,
};

/**
 * Get JSON Schema for a wizard command.
 *
 * @param command - Wizard command name
 * @returns JSON Schema object
 */
export function getJsonSchema(command: SchemaCommand): object {
	const schema = schemas[command];
	return z.toJSONSchema(schema, {
		target: 'draft-2020-12',
	});
}

/**
 * Print JSON Schema to stdout for documentation.
 * Used by `--help json` subcommand.
 *
 * @param command - Wizard command name
 */
export function showJsonSchema(command: SchemaCommand): void {
	const schema = getJsonSchema(command);
	console.log(JSON.stringify(schema, null, 2));
}

/**
 * Get all available schema commands.
 *
 * @returns Array of command names
 */
export function getAvailableSchemas(): SchemaCommand[] {
	return Object.keys(schemas) as SchemaCommand[];
}

/**
 * Check if a command has a JSON schema.
 *
 * @param command - Command name to check
 * @returns true if command supports JSON input
 */
export function hasSchema(command: string): command is SchemaCommand {
	return command in schemas;
}
