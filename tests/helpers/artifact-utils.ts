/**
 * Artifact management utilities for test infrastructure.
 *
 * Provides centralized functions for:
 * - Cleaning test output directories before each run
 * - Saving failure artifacts (PDF, HTML) for debugging
 *
 * Usage pattern per CONTEXT.md decisions:
 * - Call cleanTestOutput() in beforeAll (not afterAll)
 * - Call saveFailureArtifacts() in afterEach for failure debugging
 *
 * Note: Uses Node.js APIs because Playwright runs in Node.js runtime.
 */

import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { TestInfo } from '@playwright/test';

/**
 * Root directory for test outputs.
 *
 * All generated test artifacts are stored here. This directory is gitignored
 * and cleaned before each test run to ensure fresh state.
 */
export const TEST_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output');

/**
 * Clean the test output directory.
 *
 * Removes all contents from TEST_OUTPUT_DIR and recreates it as an empty directory.
 * Should be called in beforeAll() hooks to ensure clean state for each test run.
 *
 * Per CONTEXT.md: cleanup happens in beforeAll, not afterAll, to preserve
 * artifacts for debugging after test failures.
 *
 * @example
 * ```ts
 * test.beforeAll(async () => {
 *   await cleanTestOutput();
 *   // Generate test data...
 * });
 * ```
 */
export async function cleanTestOutput(): Promise<void> {
	await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
	await mkdir(TEST_OUTPUT_DIR, { recursive: true });
}

/**
 * Artifacts to save on test failure.
 */
export interface FailureArtifacts {
	/** Path to the PDF file to save (optional) */
	pdf?: string;
	/** Path to the HTML source file to save (optional) */
	html?: string;
	/** Label for the failure directory (e.g., "modern-single-page") */
	label: string;
}

/**
 * Save artifacts when a test fails.
 *
 * Copies PDF and HTML files to a failures directory for post-mortem debugging.
 * Only saves artifacts if the test did NOT pass (failed, timedOut, etc.).
 *
 * Per CONTEXT.md: save everything + HTML on failure for maximum debuggability.
 * Passing tests leave no artifacts - non-empty output directory means something failed.
 *
 * @param testInfo - Playwright TestInfo from the test context
 * @param artifacts - Files to save and label for the failure directory
 *
 * @example
 * ```ts
 * test.afterEach(async ({}, testInfo) => {
 *   await saveFailureArtifacts(testInfo, {
 *     pdf: result?.pdf,
 *     html: result?.html,
 *     label: `modern-${testInfo.title}`,
 *   });
 * });
 * ```
 */
export async function saveFailureArtifacts(
	testInfo: TestInfo,
	artifacts: FailureArtifacts,
): Promise<void> {
	// Only save artifacts if test did not pass
	if (testInfo.status === 'passed') {
		return;
	}

	// Create safe directory name from label
	const safeTitle = artifacts.label.replace(/[^a-z0-9]/gi, '-');
	const failDir = path.join(TEST_OUTPUT_DIR, 'failures', safeTitle);
	await mkdir(failDir, { recursive: true });

	// Copy PDF file if provided
	if (artifacts.pdf) {
		try {
			await copyFile(artifacts.pdf, path.join(failDir, 'actual.pdf'));
		} catch {
			// File may not exist if generation failed
		}
	}

	// Copy HTML source file if provided
	if (artifacts.html) {
		try {
			await copyFile(artifacts.html, path.join(failDir, 'source.html'));
		} catch {
			// File may not exist if generation failed
		}
	}
}
