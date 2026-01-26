/**
 * Workflow module public API.
 * Provides multi-stage CV improvement workflow infrastructure.
 */

// Runner infrastructure
export {
	type CVLoadResult,
	checkStagePrerequisites,
	getPreviousResults,
	isStageComplete,
	loadCVForStage,
	type StageResult,
	type StageRunnerOptions,
} from './runner.ts';
// Schemas
export {
	type AnalyzeOutput,
	AnalyzeOutputSchema,
	type ImproveOutput,
	ImproveOutputSchema,
	type SummarizeOutput,
	SummarizeOutputSchema,
	type TailorOutput,
	TailorOutputSchema,
} from './schemas/index.ts';
// Stages
export {
	type AnalyzeStageInput,
	type ImproveStageInput,
	runAnalyzeStage,
	runImproveStage,
	runSummarizeStage,
	runTailorStage,
	type SummarizeStageInput,
	type TailorStageInput,
} from './stages/index.ts';
// State persistence
export {
	createInitialState,
	getStatePath,
	loadWorkflowState,
	STATE_FILENAME,
	STATE_VERSION,
	saveWorkflowState,
	updateStageResult,
	WorkflowStateSchema,
} from './state.ts';
// Types
export type { WorkflowStage, WorkflowState } from './types.ts';
export {
	canTransitionTo,
	getNextStage,
	STAGE_ORDER,
	WorkflowError,
} from './types.ts';
