/**
 * Tests for state builder in non-interactive wizard mode.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createInitialState } from '../../state.ts';
import {
	buildWizardState,
	detectConflicts,
	hasMinimumData,
	mergeContactFlags,
} from '../state-builder.ts';

// Mock process.exit to prevent test from exiting
const mockExit = mock(() => {
	throw new Error('process.exit called');
});
const originalExit = process.exit;

beforeEach(() => {
	process.exit = mockExit as unknown as typeof process.exit;
});

afterEach(() => {
	process.exit = originalExit;
	mockExit.mockClear();
});

describe('state-builder', () => {
	describe('detectConflicts', () => {
		it('returns empty array when no JSON data', () => {
			const result = detectConflicts(undefined, { name: 'Jane' });
			expect(result).toEqual([]);
		});

		it('returns empty array when no contact in JSON', () => {
			const result = detectConflicts({}, { name: 'Jane' });
			expect(result).toEqual([]);
		});

		it('returns empty array when values match', () => {
			const result = detectConflicts(
				{ contact: { name: 'Jane' } },
				{ name: 'Jane' },
			);
			expect(result).toEqual([]);
		});

		it('detects name conflict', () => {
			const result = detectConflicts(
				{ contact: { name: 'JSON Jane' } },
				{ name: 'Flag Jane' },
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				field: 'name',
				flagValue: 'Flag Jane',
				jsonValue: 'JSON Jane',
			});
		});

		it('detects multiple conflicts', () => {
			const result = detectConflicts(
				{
					contact: {
						name: 'JSON Jane',
						email: 'json@example.com',
						location: 'JSON City',
					},
				},
				{
					name: 'Flag Jane',
					email: 'flag@example.com',
					location: 'Flag City',
				},
			);

			expect(result).toHaveLength(3);
		});

		it('ignores fields only in JSON', () => {
			const result = detectConflicts(
				{ contact: { name: 'Jane', email: 'jane@example.com' } },
				{ name: 'Jane' }, // No email flag
			);
			expect(result).toEqual([]);
		});

		it('ignores fields only in flags', () => {
			const result = detectConflicts(
				{ contact: { name: 'Jane' } },
				{ name: 'Jane', email: 'flag@example.com' },
			);
			expect(result).toEqual([]);
		});
	});

	describe('buildWizardState', () => {
		it('builds state from flags only', () => {
			const state = buildWizardState(
				undefined,
				{
					name: 'Jane Doe',
					email: 'jane@example.com',
				},
				false,
			);

			expect(state.contact?.name).toBe('Jane Doe');
			expect(state.contact?.email).toBe('jane@example.com');
			expect(state.mode).toBe('quick');
		});

		it('builds state from JSON only', () => {
			const state = buildWizardState(
				{
					contact: {
						name: 'Jane Doe',
						email: 'jane@example.com',
						location: 'San Francisco',
					},
				},
				{},
				false,
			);

			expect(state.contact?.name).toBe('Jane Doe');
			expect(state.contact?.email).toBe('jane@example.com');
			expect(state.contact?.location).toBe('San Francisco');
		});

		it('JSON takes precedence over flags for same field', () => {
			// This should error because of conflict
			expect(() =>
				buildWizardState(
					{ contact: { name: 'JSON Jane' } },
					{ name: 'Flag Jane' },
					false,
				),
			).toThrow('process.exit called');
		});

		it('flags supplement JSON when no overlap', () => {
			// This works because name matches
			const state = buildWizardState(
				{
					contact: { name: 'Jane Doe' },
				},
				{
					name: 'Jane Doe', // Same value - no conflict
				},
				false,
			);

			expect(state.contact?.name).toBe('Jane Doe');
		});

		it('normalizes STAR bullets to strings', () => {
			const state = buildWizardState(
				{
					contact: { name: 'Jane' },
					experience: [
						{
							company: 'Acme',
							role: 'Developer',
							startDate: '2020-01',
							bullets: [
								'Plain bullet',
								{
									situation: 'When servers were slow',
									action: 'optimized database queries',
									result: 'reducing latency by 50%',
								},
							],
						},
					],
				},
				{},
				false,
			);

			expect(state.experience[0]?.bullets[0]).toBe('Plain bullet');
			expect(state.experience[0]?.bullets[1]).toBe(
				'When servers were slow optimized database queries reducing latency by 50%',
			);
		});

		it('applies all sections from JSON', () => {
			const state = buildWizardState(
				{
					contact: { name: 'Jane Doe', email: 'jane@example.com' },
					experience: [
						{
							company: 'Acme',
							role: 'Developer',
							startDate: '2020-01',
							bullets: ['Built APIs'],
						},
					],
					education: [
						{
							institution: 'MIT',
							degree: 'BS',
							startDate: '2016-09',
							endDate: '2020-05',
						},
					],
					skills: [
						{
							name: 'Languages',
							skills: [{ name: 'TypeScript' }],
						},
					],
					projects: [
						{
							name: 'CV Generator',
							description: 'CLI tool',
						},
					],
					certifications: [
						{
							name: 'AWS SAA',
							issuer: 'AWS',
							date: '2024-01',
						},
					],
				},
				{},
				false,
			);

			expect(state.contact?.name).toBe('Jane Doe');
			expect(state.experience).toHaveLength(1);
			expect(state.education).toHaveLength(1);
			expect(state.skills).toHaveLength(1);
			expect(state.projects).toHaveLength(1);
			expect(state.certifications).toHaveLength(1);
		});

		it('returns empty state when no input', () => {
			const state = buildWizardState(undefined, {}, false);

			expect(state.contact).toBeNull();
			expect(state.experience).toEqual([]);
			expect(state.education).toEqual([]);
			expect(state.skills).toEqual([]);
			expect(state.projects).toEqual([]);
			expect(state.certifications).toEqual([]);
		});
	});

	describe('mergeContactFlags', () => {
		it('does nothing when no contact in state', () => {
			const state = createInitialState('quick');
			mergeContactFlags(state, { email: 'flag@example.com' });
			expect(state.contact).toBeNull();
		});

		it('fills missing email from flag', () => {
			const state = createInitialState('quick');
			state.contact = { name: 'Jane' };

			mergeContactFlags(state, { email: 'flag@example.com' });

			expect(state.contact.email).toBe('flag@example.com');
		});

		it('does not overwrite existing email', () => {
			const state = createInitialState('quick');
			state.contact = { name: 'Jane', email: 'original@example.com' };

			mergeContactFlags(state, { email: 'flag@example.com' });

			expect(state.contact.email).toBe('original@example.com');
		});

		it('fills multiple missing fields', () => {
			const state = createInitialState('quick');
			state.contact = { name: 'Jane' };

			mergeContactFlags(state, {
				email: 'jane@example.com',
				phone: '+1-555-0100',
				location: 'San Francisco',
			});

			expect(state.contact.email).toBe('jane@example.com');
			expect(state.contact.phone).toBe('+1-555-0100');
			expect(state.contact.location).toBe('San Francisco');
		});
	});

	describe('hasMinimumData', () => {
		it('returns false for null contact', () => {
			const state = createInitialState('quick');
			expect(hasMinimumData(state)).toBe(false);
		});

		it('returns false for empty name', () => {
			const state = createInitialState('quick');
			state.contact = { name: '' };
			expect(hasMinimumData(state)).toBe(false);
		});

		it('returns true for valid name', () => {
			const state = createInitialState('quick');
			state.contact = { name: 'Jane' };
			expect(hasMinimumData(state)).toBe(true);
		});
	});
});
