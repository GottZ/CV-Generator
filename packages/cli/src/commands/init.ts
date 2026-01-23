import { access, constants } from 'node:fs/promises';
import path from 'node:path';
import { createConsole } from '../lib/console.ts';
import { promptName, promptOverwrite } from '../lib/prompts.ts';
import { createCvDirectory, slugifyName } from '../lib/scaffolder.ts';

export interface InitOptions {
	quiet?: boolean;
	json?: boolean;
}

// Exit code for user cancellation (SIGINT convention per RESEARCH.md)
const EXIT_USER_CANCELLED = 130;

/**
 * Init action - scaffold a new CV directory with example content.
 *
 * Creates:
 * - people/{name}/cv.md - Example CV with inline comments
 * - people/{name}/images/photo.jpg - Placeholder photo
 *
 * @param nameArg - Optional person name argument (prompted if not provided)
 * @param options - Command options (quiet, json)
 */
export async function initAction(
	nameArg: string | undefined,
	options: InitOptions,
): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });

	// Determine name (from arg or interactive prompt)
	let name: string;
	if (nameArg) {
		name = slugifyName(nameArg);
	} else {
		// Interactive mode: prompt for name
		const inputName = await promptName();
		if (!inputName) {
			cons.error('Name is required');
			process.exit(1);
		}
		name = slugifyName(inputName);
	}

	// Build person directory path
	const cwd = process.cwd();
	const personDir = path.join(cwd, 'people', name);

	// Check if directory already exists
	let exists = false;
	try {
		await access(personDir, constants.F_OK);
		exists = true;
	} catch {
		// Directory does not exist - that's fine
	}

	if (exists) {
		const choice = await promptOverwrite(path.relative(cwd, personDir));

		switch (choice) {
			case 'overwrite':
				// Continue with scaffolding (will overwrite files)
				break;
			case 'skip':
				cons.info('Skipping...');
				return;
			case 'cancel':
				cons.info('Cancelled');
				process.exit(EXIT_USER_CANCELLED);
		}
	}

	// Create CV directory structure
	await createCvDirectory(personDir);

	// Success output
	const relativeDir = path.relative(cwd, personDir);
	cons.success(`Created ${relativeDir}/`);
	cons.info('  cv.md - Edit this file with your CV content');
	cons.info('  images/photo.jpg - Replace with your photo');
	cons.info('');
	cons.info(`Next: cvgen build ${name} base`);
}
