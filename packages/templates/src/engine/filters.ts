import dayjs from 'dayjs';
import { marked } from 'marked';
import nunjucks from 'nunjucks';
import { getLocalizedText, getSectionHeader } from '../i18n/index.ts';

/**
 * Register all custom filters on a Nunjucks environment.
 */
export function registerFilters(env: nunjucks.Environment): void {
	registerDateFilters(env);
	registerMarkdownFilters(env);
	registerI18nFilters(env);
	registerUrlFilters(env);
}

/**
 * Date formatting filters using dayjs.
 */
function registerDateFilters(env: nunjucks.Environment): void {
	// Format a single date: "2024-01" -> "Jan 2024"
	env.addFilter('formatDate', (date: string, locale: string = 'en') => {
		if (!date) return '';

		// Handle "present" / "heute" for current positions
		const lowerDate = date.toLowerCase();
		if (
			lowerDate === 'present' ||
			lowerDate === 'heute' ||
			lowerDate === 'current'
		) {
			return locale === 'de' ? 'heute' : 'Present';
		}

		const parsed = dayjs(date);
		if (!parsed.isValid()) return date;

		// Format: "Jan 2024"
		return parsed.format('MMM YYYY');
	});

	// Format a date range: "Jan 2020 - Present"
	env.addFilter(
		'dateRange',
		(start: string, end: string, locale: string = 'en') => {
			const formatDate = env.getFilter('formatDate') as (
				date: string,
				locale: string,
			) => string;
			const separator = ' - ';
			return `${formatDate(start, locale)}${separator}${formatDate(end, locale)}`;
		},
	);
}

/**
 * Markdown rendering filters using marked.
 * Returns SafeString to bypass autoescape (per RESEARCH.md Pitfall 1).
 */
function registerMarkdownFilters(env: nunjucks.Environment): void {
	// Configure marked for ATS-safe output
	marked.use({
		gfm: true,
		breaks: false, // Don't convert single \n to <br>
	});

	// Inline markdown (for single lines like summary, bullets)
	// Uses parseInline to avoid wrapping in <p> tags
	env.addFilter('md', (content: string) => {
		if (!content) return '';
		const html = marked.parseInline(content) as string;
		return new nunjucks.runtime.SafeString(html);
	});

	// Block markdown (for multi-paragraph content)
	env.addFilter('mdBlock', (content: string) => {
		if (!content) return '';
		const html = marked.parse(content) as string;
		return new nunjucks.runtime.SafeString(html);
	});
}

/**
 * Internationalization filters for section headers and general text.
 */
function registerI18nFilters(env: nunjucks.Environment): void {
	// Get localized section header
	env.addFilter('sectionHeader', (section: string, locale: string = 'en') => {
		return getSectionHeader(section, locale);
	});

	// Get localized text by key (general i18n)
	env.addFilter('i18n', (key: string, locale: string = 'en') => {
		return getLocalizedText(key, locale);
	});
}

/**
 * Format URL for display: remove protocol and trailing slash.
 * Per CONTEXT.md: "Display: icon (if theme provides) + cleaned URL (no `https://`, no trailing slash)"
 *
 * "https://github.com/user/repo/" -> "github.com/user/repo"
 */
export function formatLinkUrl(url: string): string {
	if (!url) return '';
	return url
		.replace(/^https?:\/\//, '') // Remove protocol
		.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * URL formatting filters.
 */
function registerUrlFilters(env: nunjucks.Environment): void {
	env.addFilter('formatLinkUrl', (url: string) => formatLinkUrl(url));
}
