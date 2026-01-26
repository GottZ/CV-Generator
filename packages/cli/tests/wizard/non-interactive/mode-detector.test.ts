/**
 * Tests for wizard mode detection.
 * Verifies TTY detection and flag-based mode switching.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import type { WizardModeOptions } from '../../../src/wizard/non-interactive/mode-detector.ts';
import { detectMode } from '../../../src/wizard/non-interactive/mode-detector.ts';

describe('detectMode', () => {
	// Store original isTTY value
	const originalIsTTY = process.stdin.isTTY;

	beforeEach(() => {
		// Reset to original value before each test
		Object.defineProperty(process.stdin, 'isTTY', {
			value: originalIsTTY,
			writable: true,
			configurable: true,
		});
	});

	test('returns non-interactive when process.stdin.isTTY is false', () => {
		// Mock non-TTY environment
		Object.defineProperty(process.stdin, 'isTTY', {
			value: false,
			writable: true,
			configurable: true,
		});

		const result = detectMode({});
		expect(result).toBe('non-interactive');
	});

	test('returns non-interactive when --no-input flag is set', () => {
		// Even with TTY, --no-input forces non-interactive
		Object.defineProperty(process.stdin, 'isTTY', {
			value: true,
			writable: true,
			configurable: true,
		});

		const options: WizardModeOptions = { noInput: true };
		const result = detectMode(options);
		expect(result).toBe('non-interactive');
	});

	test('returns interactive when --force-interactive overrides non-TTY', () => {
		// Mock non-TTY environment
		Object.defineProperty(process.stdin, 'isTTY', {
			value: false,
			writable: true,
			configurable: true,
		});

		const options: WizardModeOptions = { forceInteractive: true };
		const result = detectMode(options);
		expect(result).toBe('interactive');
	});

	test('returns interactive by default when TTY is true and no flags set', () => {
		// Mock TTY environment
		Object.defineProperty(process.stdin, 'isTTY', {
			value: true,
			writable: true,
			configurable: true,
		});

		const result = detectMode({});
		expect(result).toBe('interactive');
	});

	test('--force-interactive takes precedence over --no-input', () => {
		const options: WizardModeOptions = {
			forceInteractive: true,
			noInput: true,
		};
		const result = detectMode(options);
		expect(result).toBe('interactive');
	});

	test('--no-input takes precedence over TTY detection', () => {
		// TTY is true, but --no-input forces non-interactive
		Object.defineProperty(process.stdin, 'isTTY', {
			value: true,
			writable: true,
			configurable: true,
		});

		const options: WizardModeOptions = { noInput: true };
		const result = detectMode(options);
		expect(result).toBe('non-interactive');
	});

	test('other options do not affect mode detection', () => {
		Object.defineProperty(process.stdin, 'isTTY', {
			value: true,
			writable: true,
			configurable: true,
		});

		// jsonInput, dryRun, enhance, json should not change the mode
		const options: WizardModeOptions = {
			jsonInput: 'input.json',
			dryRun: true,
			enhance: true,
			json: true,
		};
		const result = detectMode(options);
		expect(result).toBe('interactive');
	});
});
