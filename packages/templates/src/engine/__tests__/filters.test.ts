/**
 * Tests for template filters in filters.ts.
 * Verifies date formatting for year-only, YYYY-MM, and present/heute values.
 */

import { describe, expect, it } from 'bun:test';
import nunjucks from 'nunjucks';
import { registerFilters } from '../filters.ts';

describe('template filters', () => {
	// Set up Nunjucks environment with filters
	const env = nunjucks.configure({ autoescape: true });
	registerFilters(env);

	const formatDate = env.getFilter('formatDate') as (
		date: string,
		locale: string,
	) => string;
	const dateRange = env.getFilter('dateRange') as (
		start: string,
		end: string,
		locale: string,
	) => string;

	describe('formatDate', () => {
		describe('year-only format', () => {
			it('returns year-only dates as-is (en)', () => {
				expect(formatDate('2001', 'en')).toBe('2001');
			});

			it('returns year-only dates as-is (de)', () => {
				expect(formatDate('2001', 'de')).toBe('2001');
			});

			it('returns four-digit years without modification', () => {
				expect(formatDate('1999', 'en')).toBe('1999');
				expect(formatDate('2024', 'en')).toBe('2024');
			});
		});

		describe('YYYY-MM format', () => {
			it('formats with month and year (en)', () => {
				expect(formatDate('2024-01', 'en')).toBe('Jan 2024');
			});

			it('formats with month and year (de)', () => {
				// German uses abbreviated months with period
				expect(formatDate('2024-01', 'de')).toBe('Jan. 2024');
			});

			it('formats different months correctly', () => {
				expect(formatDate('2024-06', 'en')).toBe('Jun 2024');
				expect(formatDate('2024-12', 'en')).toBe('Dec 2024');
			});
		});

		describe('present/heute handling', () => {
			it('returns "Present" for "present" (en)', () => {
				expect(formatDate('present', 'en')).toBe('Present');
			});

			it('returns "heute" for "present" (de)', () => {
				expect(formatDate('present', 'de')).toBe('heute');
			});

			it('returns "heute" for "heute" (de)', () => {
				expect(formatDate('heute', 'de')).toBe('heute');
			});

			it('returns "Present" for "heute" (en)', () => {
				expect(formatDate('heute', 'en')).toBe('Present');
			});

			it('handles "current" keyword', () => {
				expect(formatDate('current', 'en')).toBe('Present');
				expect(formatDate('current', 'de')).toBe('heute');
			});

			it('handles case insensitivity', () => {
				expect(formatDate('PRESENT', 'en')).toBe('Present');
				expect(formatDate('Present', 'en')).toBe('Present');
				expect(formatDate('HEUTE', 'de')).toBe('heute');
			});
		});

		describe('edge cases', () => {
			it('returns empty string for empty input', () => {
				expect(formatDate('', 'en')).toBe('');
			});

			it('returns original string for invalid date', () => {
				expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
			});

			it('uses "en" as default locale', () => {
				// @ts-expect-error - testing default parameter
				expect(formatDate('present')).toBe('Present');
			});
		});
	});

	describe('dateRange', () => {
		it('formats year-only range (en)', () => {
			expect(dateRange('2001', 'present', 'en')).toBe('2001 - Present');
		});

		it('formats year-only range (de)', () => {
			expect(dateRange('2001', 'heute', 'de')).toBe('2001 - heute');
		});

		it('formats YYYY-MM range (en)', () => {
			expect(dateRange('2024-01', '2024-06', 'en')).toBe('Jan 2024 - Jun 2024');
		});

		it('formats YYYY-MM range (de)', () => {
			expect(dateRange('2024-01', '2024-06', 'de')).toBe(
				'Jan. 2024 - Juni 2024',
			);
		});

		it('formats mixed year-only and YYYY-MM (en)', () => {
			expect(dateRange('2020', '2024-06', 'en')).toBe('2020 - Jun 2024');
		});

		it('formats YYYY-MM to present (en)', () => {
			expect(dateRange('2024-01', 'present', 'en')).toBe('Jan 2024 - Present');
		});

		it('formats YYYY-MM to present (de)', () => {
			expect(dateRange('2024-01', 'heute', 'de')).toBe('Jan. 2024 - heute');
		});
	});
});
