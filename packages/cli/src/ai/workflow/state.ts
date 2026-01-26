/**
 * Per-person workflow state persistence.
 * Stores state at /people/[name]/output/.ai-state.json
 * Per RESEARCH.md: Use atomic writes and versioned schema.
 */

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type {
	AnalyzeOutput,
	ImproveOutput,
	SummarizeOutput,
	TailorOutput,
} from './schemas/index.ts';
import type { WorkflowStage, WorkflowState } from './types.ts';

/**
 * Filename for workflow state file.
 */
export const STATE_FILENAME = '.ai-state.json';

/**
 * Current state schema version.
 * Increment when making breaking changes to state structure.
 */
export const STATE_VERSION = 1;

/**
 * Zod schema for runtime validation of loaded state.
 */
export const WorkflowStateSchema = z.object({
	version: z.number(),
	currentStage: z.enum([
		'not_started',
		'analyzed',
		'improved',
		'summarized',
		'tailored',
	]),
	completedAt: z.record(z.string(), z.string()).optional(),
	stageResults: z
		.object({
			analyze: z.unknown().optional(),
			improve: z.unknown().optional(),
			summarize: z.unknown().optional(),
			tailor: z.unknown().optional(),
		})
		.optional(),
	cvPath: z.string(),
	locale: z.string(),
	lastUpdated: z.string(),
});

/**
 * Get path to workflow state file for a person.
 * State is stored at /people/[name]/output/.ai-state.json
 *
 * @param personDir - Path to person directory (e.g., /workspace/people/jane)
 * @returns Absolute path to .ai-state.json
 */
export function getStatePath(personDir: string): string {
	return path.join(personDir, 'output', STATE_FILENAME);
}

/**
 * Atomic write to prevent corruption from interrupted writes.
 * Per RESEARCH.md: Write to temp file, then rename (atomic on most filesystems).
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
	const tempPath = `${filePath}.${randomUUID()}.tmp`;
	await writeFile(tempPath, content, 'utf-8');
	await rename(tempPath, filePath);
}

/**
 * Load workflow state from person's output directory.
 * Returns null if state file doesn't exist or is invalid.
 *
 * @param personDir - Path to person directory
 * @returns Workflow state or null if not found/invalid
 */
export async function loadWorkflowState(
	personDir: string,
): Promise<WorkflowState | null> {
	const statePath = getStatePath(personDir);

	try {
		const content = await readFile(statePath, 'utf-8');
		const data = JSON.parse(content);

		// Validate with Zod
		const result = WorkflowStateSchema.safeParse(data);
		if (!result.success) {
			console.warn(`Invalid state file at ${statePath}:`, result.error.issues);
			return null;
		}

		// Check version and warn if outdated
		if (result.data.version !== STATE_VERSION) {
			console.warn(
				`State file version ${result.data.version} differs from current ${STATE_VERSION}. Consider re-running analysis.`,
			);
			// Continue anyway - allows forward compatibility
		}

		// Cast to full type (stageResults have proper types at runtime)
		return {
			version: result.data.version,
			currentStage: result.data.currentStage,
			completedAt: (result.data.completedAt ?? {}) as Partial<
				Record<WorkflowStage, string>
			>,
			stageResults: (result.data.stageResults ?? {}) as {
				analyze?: AnalyzeOutput;
				improve?: ImproveOutput;
				summarize?: SummarizeOutput;
				tailor?: TailorOutput;
			},
			cvPath: result.data.cvPath,
			locale: result.data.locale,
			lastUpdated: result.data.lastUpdated,
		};
	} catch {
		// File doesn't exist or JSON parse error
		return null;
	}
}

/**
 * Save workflow state to person's output directory.
 * Creates output directory if it doesn't exist.
 * Uses atomic write to prevent corruption.
 *
 * @param personDir - Path to person directory
 * @param state - Workflow state to save
 */
export async function saveWorkflowState(
	personDir: string,
	state: WorkflowState,
): Promise<void> {
	const outputDir = path.join(personDir, 'output');
	await mkdir(outputDir, { recursive: true });

	const statePath = getStatePath(personDir);
	const stateWithTimestamp: WorkflowState = {
		...state,
		lastUpdated: new Date().toISOString(),
	};

	await atomicWrite(statePath, JSON.stringify(stateWithTimestamp, null, 2));
}

/**
 * Create initial workflow state for a new CV.
 *
 * @param cvPath - Path to CV markdown file
 * @param locale - Locale for localized prompts
 * @returns New workflow state at 'not_started' stage
 */
export function createInitialState(
	cvPath: string,
	locale: string,
): WorkflowState {
	return {
		version: STATE_VERSION,
		currentStage: 'not_started',
		completedAt: {},
		stageResults: {},
		cvPath,
		locale,
		lastUpdated: new Date().toISOString(),
	};
}

/**
 * Update state with a stage result (immutable update).
 * Returns a new state object with the updated stage result.
 *
 * @param state - Current workflow state
 * @param stage - Stage key (analyze, improve, summarize, tailor)
 * @param result - Result from the stage
 * @returns New state with updated stage result
 */
export function updateStageResult<
	K extends keyof WorkflowState['stageResults'],
>(
	state: WorkflowState,
	stage: K,
	result: WorkflowState['stageResults'][K],
): WorkflowState {
	const stageToCompletedStage: Record<string, WorkflowStage> = {
		analyze: 'analyzed',
		improve: 'improved',
		summarize: 'summarized',
		tailor: 'tailored',
	};

	const completedStage = stageToCompletedStage[stage];
	if (!completedStage) {
		throw new Error(`Unknown stage: ${stage}`);
	}

	return {
		...state,
		currentStage: completedStage,
		completedAt: {
			...state.completedAt,
			[completedStage]: new Date().toISOString(),
		},
		stageResults: {
			...state.stageResults,
			[stage]: result,
		},
		lastUpdated: new Date().toISOString(),
	};
}
