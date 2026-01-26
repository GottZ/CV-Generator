/**
 * Editor integration for reviewing and editing AI suggestions.
 * Uses $EDITOR / $VISUAL / vi for cross-platform editor spawning.
 */

import { edit } from 'external-editor';

/**
 * Result of an editor session.
 */
export interface EditorResult {
	/** The edited content, or null if cancelled */
	content: string | null;
	/** Whether the edit was cancelled (empty content) */
	cancelled: boolean;
}

/**
 * Opens the user's preferred editor with original and suggested text.
 * The original is shown as a read-only reference in comments.
 * User edits the suggestion portion; comment lines are stripped.
 *
 * @param original - The original bullet text (shown as reference)
 * @param suggested - The AI-suggested text (editable)
 * @returns EditorResult with edited content or cancelled status
 */
export function openInEditor(
	original: string,
	suggested: string,
): EditorResult {
	// Build temp file content per CONTEXT.md spec
	const tempContent = `# Original (read-only reference):
# ${original}

# Edit the suggestion below (delete all to cancel):
${suggested}
`;

	try {
		// external-editor handles:
		// - $VISUAL / $EDITOR / vi fallback
		// - Temp file creation and cleanup
		// - Sync execution (blocks until editor closes)
		const result = edit(tempContent, { postfix: '.md' });

		// Strip comment lines (lines starting with #) from result
		const lines = result.split('\n');
		const contentLines = lines.filter((line) => !line.startsWith('#'));
		const content = contentLines.join('\n').trim();

		// If empty after stripping: treat as cancel
		if (content === '') {
			return { content: null, cancelled: true };
		}

		return { content, cancelled: false };
	} catch {
		// On error, treat as cancel
		return { content: null, cancelled: true };
	}
}
