/**
 * Workflow stage types and state management.
 * Implements discriminated union state machine for linear workflow progression.
 * Per RESEARCH.md: Simple TypeScript types enforce valid state transitions.
 */

import type {
	AnalyzeOutput,
	ImproveOutput,
	SummarizeOutput,
	TailorOutput,
} from './schemas/index.ts';

/**
 * Workflow stage discriminated union type.
 * Represents the current position in the 4-stage workflow.
 */
export type WorkflowStage =
	| 'not_started'
	| 'analyzed'
	| 'improved'
	| 'summarized'
	| 'tailored';

/**
 * Stage order constant defining linear progression.
 * Analyze -> Improve -> Summarize -> Tailor
 */
export const STAGE_ORDER: readonly WorkflowStage[] = [
	'not_started',
	'analyzed',
	'improved',
	'summarized',
	'tailored',
] as const;

/**
 * Workflow state persisted to .ai-state.json.
 * Contains current progress, timestamps, and stage results.
 */
export interface WorkflowState {
	/** Schema version for migration support */
	version: number;
	/** Current stage in the workflow */
	currentStage: WorkflowStage;
	/** ISO timestamps when each stage was completed */
	completedAt: Partial<Record<WorkflowStage, string>>;
	/** Structured results from each stage */
	stageResults: {
		analyze?: AnalyzeOutput;
		improve?: ImproveOutput;
		summarize?: SummarizeOutput;
		tailor?: TailorOutput;
	};
	/** Path to the CV markdown file being processed */
	cvPath: string;
	/** Locale for localized prompts */
	locale: string;
	/** ISO timestamp of last state update */
	lastUpdated: string;
}

/**
 * Check if a transition from current stage to target stage is valid.
 * Per RESEARCH.md: Can only advance one stage at a time (linear progression).
 *
 * @param current - Current workflow stage
 * @param target - Target workflow stage
 * @returns true if transition is allowed
 */
export function canTransitionTo(
	current: WorkflowStage,
	target: WorkflowStage,
): boolean {
	const currentIdx = STAGE_ORDER.indexOf(current);
	const targetIdx = STAGE_ORDER.indexOf(target);
	// Can only advance one stage at a time
	return targetIdx === currentIdx + 1;
}

/**
 * Get the next stage in the workflow progression.
 *
 * @param current - Current workflow stage
 * @returns Next stage or null if workflow is complete
 */
export function getNextStage(current: WorkflowStage): WorkflowStage | null {
	const currentIdx = STAGE_ORDER.indexOf(current);
	if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) {
		return null;
	}
	return STAGE_ORDER[currentIdx + 1] ?? null;
}

/**
 * Error class for workflow-related errors.
 * Includes stage context for better error messages.
 */
export class WorkflowError extends Error {
	/** Stage where the error occurred */
	readonly stage: WorkflowStage | string;

	constructor(stage: WorkflowStage | string, message: string) {
		super(`[${stage}] ${message}`);
		this.name = 'WorkflowError';
		this.stage = stage;
	}
}
