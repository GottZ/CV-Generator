/**
 * Review module for AI suggestion review workflow.
 * Provides interactive prompts for accept/edit/skip/regenerate actions.
 */

// Editor integration for editing suggestions in $EDITOR
export { type EditorResult, openInEditor } from './editor-integration.js';
export type { ChangeSummary, WriteResult } from './file-writer.js';
// File writer with backup and confirmation
export { safeWriteCvFile } from './file-writer.js';
export type { ReviewAction, ReviewContext } from './review-prompt.js';
// Review prompt for single-key action menu
export { promptReviewAction } from './review-prompt.js';
