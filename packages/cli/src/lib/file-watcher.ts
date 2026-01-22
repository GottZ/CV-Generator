import chokidar, { type FSWatcher } from 'chokidar';
import debounce from 'lodash.debounce';

export interface WatchOptions {
	peopleDir: string;
	templatesDir: string;
	filter?: { cv?: string; template?: string };
	onRebuild: (changed: string) => Promise<void>;
}

/**
 * Create file watcher for watch mode.
 * Per CONTEXT.md:
 * - Watch triggers on template files and all CV files
 * - --watch=cv:johndoe for specific CV, --watch=t:base for template
 * - Debounce rapid changes
 */
export function createWatcher(options: WatchOptions): FSWatcher {
	const { peopleDir, templatesDir, filter, onRebuild } = options;

	const paths: string[] = [];

	// CV paths
	if (filter?.cv) {
		paths.push(`${peopleDir}/${filter.cv}/**/*`);
	} else {
		paths.push(`${peopleDir}/**/*`);
	}

	// Template paths
	if (filter?.template) {
		paths.push(`${templatesDir}/${filter.template}/**/*`);
	} else {
		paths.push(`${templatesDir}/**/*`);
	}

	// Debounce rebuilds per CONTEXT.md (handle rapid successive changes)
	const debouncedRebuild = debounce(onRebuild, 300, {
		leading: false,
		trailing: true,
	});

	const watcher = chokidar.watch(paths, {
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
		ignored: [
			'**/output/**', // Don't watch output directory
			'**/node_modules/**',
			'**/.git/**',
		],
	});

	watcher
		.on('add', (path) => debouncedRebuild(path))
		.on('change', (path) => debouncedRebuild(path))
		.on('unlink', (path) => debouncedRebuild(path))
		.on('error', (error) => console.error('Watch error:', error));

	return watcher;
}

/**
 * Parse watch filter string (cv:name, t:template).
 * Per CONTEXT.md: comma-separated, default watches all.
 */
export function parseWatchFilter(filterArg: string | boolean | undefined): {
	cv?: string;
	template?: string;
} {
	if (!filterArg || filterArg === true) {
		return {}; // Watch all
	}

	const result: { cv?: string; template?: string } = {};

	for (const part of filterArg.split(',')) {
		const trimmed = part.trim();
		if (trimmed.startsWith('cv:')) {
			result.cv = trimmed.slice(3);
		} else if (trimmed.startsWith('t:')) {
			result.template = trimmed.slice(2);
		}
	}

	return result;
}
