/**
 * Project state persistence for AI settings.
 * Stores last-used provider and other session state.
 * Per CONTEXT.md: State in project root .cvgen-state.json (not global).
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProviderType } from './types.ts';

interface ProjectState {
	lastProvider?: ProviderType;
	lastModel?: Record<ProviderType, string>;
}

const STATE_FILENAME = '.cvgen-state.json';

/**
 * Get project state file path.
 */
function getStatePath(projectRoot: string): string {
	return path.join(projectRoot, STATE_FILENAME);
}

/**
 * Load project state from file.
 */
export async function getProjectState(
	projectRoot: string,
): Promise<ProjectState> {
	const statePath = getStatePath(projectRoot);
	try {
		const content = await readFile(statePath, 'utf-8');
		return JSON.parse(content) as ProjectState;
	} catch {
		// State file doesn't exist or is invalid
		return {};
	}
}

/**
 * Save project state to file.
 */
async function saveProjectState(
	projectRoot: string,
	state: ProjectState,
): Promise<void> {
	const statePath = getStatePath(projectRoot);
	await writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Get last-used provider from state.
 */
export async function getLastProvider(
	projectRoot: string,
): Promise<ProviderType | undefined> {
	const state = await getProjectState(projectRoot);
	return state.lastProvider;
}

/**
 * Set last-used provider in state.
 */
export async function setLastProvider(
	projectRoot: string,
	provider: ProviderType,
): Promise<void> {
	const state = await getProjectState(projectRoot);
	state.lastProvider = provider;
	await saveProjectState(projectRoot, state);
}

/**
 * Get last-used model for a provider.
 */
export async function getLastModel(
	projectRoot: string,
	provider: ProviderType,
): Promise<string | undefined> {
	const state = await getProjectState(projectRoot);
	return state.lastModel?.[provider];
}

/**
 * Set last-used model for a provider.
 */
export async function setLastModel(
	projectRoot: string,
	provider: ProviderType,
	model: string,
): Promise<void> {
	const state = await getProjectState(projectRoot);
	if (!state.lastModel) {
		state.lastModel = {} as Record<ProviderType, string>;
	}
	state.lastModel[provider] = model;
	await saveProjectState(projectRoot, state);
}
