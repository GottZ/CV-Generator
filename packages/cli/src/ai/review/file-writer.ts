/**
 * Safe file writing with backup and user confirmation.
 * Never auto-writes - always requires explicit user consent.
 */

import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { confirm } from '@inquirer/prompts';
import pc from 'picocolors';

/**
 * Result of a file write operation.
 */
export interface WriteResult {
	success: boolean;
	backupPath?: string;
	error?: string;
}

/**
 * Summary of changes made during a review session.
 */
export interface ChangeSummary {
	accepted: number;
	skipped: number;
	edited: number;
}

/**
 * Safely writes CV content with backup and user confirmation.
 * Displays a summary, prompts for confirmation, creates backup, then writes.
 *
 * @param cvPath - Path to the CV file to update
 * @param newContent - The new content to write
 * @param changes - Summary of changes for display
 * @returns WriteResult indicating success/failure and backup path
 */
export async function safeWriteCvFile(
	cvPath: string,
	newContent: string,
	changes: ChangeSummary,
): Promise<WriteResult> {
	try {
		// Display review summary
		console.log(pc.bold('\nReview Summary:'));
		console.log(`  Accepted: ${pc.green(String(changes.accepted))}`);
		console.log(`  Skipped:  ${pc.yellow(String(changes.skipped))}`);
		console.log(`  Edited:   ${pc.blue(String(changes.edited))}`);
		console.log();

		// Prompt for confirmation (default: false for safety)
		const shouldWrite = await confirm({
			message: `Write changes to ${cvPath}?`,
			default: false,
		});

		if (!shouldWrite) {
			console.log(pc.dim('Changes discarded.'));
			return { success: false };
		}

		// Determine backup path
		const defaultBackupPath = `${cvPath}.bak`;
		let backupPath: string;

		if (existsSync(defaultBackupPath)) {
			// Use timestamped backup if default already exists
			backupPath = `${cvPath}.${Date.now()}.bak`;
		} else {
			backupPath = defaultBackupPath;
		}

		// Create backup
		copyFileSync(cvPath, backupPath);
		console.log(pc.dim(`Backup created: ${backupPath}`));

		// Write new content
		writeFileSync(cvPath, newContent, 'utf-8');
		console.log(pc.green(`Updated: ${cvPath}`));

		return { success: true, backupPath };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}
