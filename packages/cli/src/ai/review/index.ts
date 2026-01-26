/**
 * Review module for AI suggestion review workflow.
 * Provides interactive prompts for accept/edit/skip/regenerate actions.
 */

// CV content updater for applying reviewed changes
export { applyReviewedChanges } from './cv-updater.js';
// Editor integration for editing suggestions in $EDITOR
export { type EditorResult, openInEditor } from './editor-integration.js';
export type { ChangeSummary, WriteResult } from './file-writer.js';
// File writer with backup and confirmation
export { safeWriteCvFile } from './file-writer.js';
export type {
	RegenerateOptions,
	RegenerateResult,
	RegenerationAttempt,
} from './regeneration.js';
// Regeneration with similarity detection and history
export {
	jaccardSimilarity,
	REGENERATE_SIGNAL,
	regenerateWithGuidance,
	selectFromHistory,
	truncate,
} from './regeneration.js';
export type { ReviewAction, ReviewContext } from './review-prompt.js';
// Review prompt for single-key action menu
export { promptReviewAction } from './review-prompt.js';
// Review session orchestrator
export type { ReviewItem, ReviewState } from './review-session.js';
export { runReviewSession } from './review-session.js';
// TTY detection for non-interactive environments
export { ensureInteractiveMode, getTerminalWidth, isTTY } from './tty-check.js';
export type { WeaknessType } from './weak-bullet-detector.js';
// Weak bullet detection for AI-14
export {
	detectWeakness,
	displayWeakBulletWarning,
	WEAKNESS_REASONS,
} from './weak-bullet-detector.js';
