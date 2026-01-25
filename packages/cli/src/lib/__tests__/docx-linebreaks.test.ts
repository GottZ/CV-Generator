/**
 * Tests for DOCX linebreak handling in section builders.
 *
 * Linebreak behavior in DOCX:
 * - Single \n: Creates line break within paragraph (TextRun with w:br element)
 * - Double \n\n: Creates separate paragraphs
 * - Bullets: Content after bullet marker respects single newlines
 * - Windows \r\n: Normalized to \n for consistent handling
 */

import { describe, expect, it } from 'bun:test';
import type { CVData } from '@gottz/cv-core';
import type { Paragraph, TextRun } from 'docx';
import { buildDocumentContent, textWithBreaks } from '../docx-sections';

/** Internal element structure with rootKey for docx library */
interface InternalElement {
	rootKey: string;
	root?: (string | InternalElement)[];
}

/**
 * Check if a TextRun has a break element (w:br).
 * The docx library stores break as a Break element in the root array.
 */
function hasBreak(run: TextRun): boolean {
	const internalRun = run as unknown as { root: InternalElement[] };
	return internalRun.root?.some((el) => el.rootKey === 'w:br') ?? false;
}

/**
 * Get the text content from a TextRun.
 * Text is stored in a Text element (w:t) in the root array.
 */
function getText(run: TextRun): string | undefined {
	const internalRun = run as unknown as { root: InternalElement[] };
	const textEl = internalRun.root?.find((el) => el.rootKey === 'w:t');
	if (textEl?.root) {
		// Text content is the second item in the root array (first is attributes)
		return textEl.root[1] as string;
	}
	return undefined;
}

/**
 * Helper to count line breaks (w:br elements) in paragraphs.
 * Inspects the internal root array of TextRun children.
 */
function countLineBreaks(paragraphs: Paragraph[]): number {
	let count = 0;
	for (const p of paragraphs) {
		const internalP = p as unknown as { root: InternalElement[] };
		if (!internalP.root) continue;

		for (const child of internalP.root) {
			// TextRun elements have root arrays
			if (child.rootKey === 'w:r' && child.root) {
				// Check for break element in the TextRun's root
				const hasBreakEl = child.root.some(
					(el) => typeof el === 'object' && el.rootKey === 'w:br',
				);
				if (hasBreakEl) count++;
			}
		}
	}
	return count;
}

/**
 * Helper to extract all text from paragraphs for content verification.
 */
function extractText(paragraphs: Paragraph[]): string[] {
	const texts: string[] = [];
	for (const p of paragraphs) {
		const internalP = p as unknown as { root: InternalElement[] };
		if (!internalP.root) continue;

		let paragraphText = '';
		for (const child of internalP.root) {
			if (child.rootKey === 'w:r' && child.root) {
				// Find text element in TextRun
				for (const el of child.root) {
					if (typeof el === 'object' && el.rootKey === 'w:t' && el.root) {
						const textContent = el.root[1];
						if (typeof textContent === 'string') {
							paragraphText += textContent;
						}
					}
				}
			}
		}
		if (paragraphText) {
			texts.push(paragraphText);
		}
	}
	return texts;
}

describe('DOCX linebreak handling', () => {
	describe('textWithBreaks utility', () => {
		it('returns single TextRun for text without newlines', () => {
			const runs = textWithBreaks('Hello world');
			expect(runs).toHaveLength(1);
			const first = runs[0];
			if (!first) throw new Error('Expected first TextRun');
			expect(getText(first)).toBe('Hello world');
		});

		it('creates line break for single newline', () => {
			const runs = textWithBreaks('Line one\nLine two');
			expect(runs).toHaveLength(2);

			// First line - no break
			const first = runs[0];
			const second = runs[1];
			if (!first || !second) throw new Error('Expected two TextRuns');
			expect(getText(first)).toBe('Line one');
			expect(hasBreak(first)).toBe(false);

			// Second line - has break (w:br element)
			expect(getText(second)).toBe('Line two');
			expect(hasBreak(second)).toBe(true);
		});

		it('handles multiple single newlines', () => {
			const runs = textWithBreaks('Line 1\nLine 2\nLine 3');
			expect(runs).toHaveLength(3);

			// Lines 2 and 3 should have breaks
			const [first, second, third] = runs;
			if (!first || !second || !third)
				throw new Error('Expected three TextRuns');
			expect(hasBreak(first)).toBe(false);
			expect(hasBreak(second)).toBe(true);
			expect(hasBreak(third)).toBe(true);
		});

		it('skips empty lines (no empty TextRuns)', () => {
			const runs = textWithBreaks('Line one\n\nLine two');
			// Double newline becomes one empty line - should be skipped
			expect(runs).toHaveLength(2);
		});

		it('preserves formatting options on all TextRuns', () => {
			const runs = textWithBreaks('Bold line\nAnother bold', { bold: true });
			expect(runs).toHaveLength(2);

			// Check that bold formatting is applied
			// Bold is stored in w:rPr > w:b element
			for (const run of runs) {
				const internalRun = run as unknown as { root: InternalElement[] };
				const rPr = internalRun.root?.find((el) => el.rootKey === 'w:rPr');
				const hasBold = rPr?.root?.some(
					(el) => typeof el === 'object' && el.rootKey === 'w:b',
				);
				expect(hasBold).toBe(true);
			}
		});

		it('normalizes Windows newlines (\\r\\n)', () => {
			const runs = textWithBreaks('Windows\r\nline breaks');
			expect(runs).toHaveLength(2);
			const second = runs[1];
			if (!second) throw new Error('Expected second TextRun');
			expect(hasBreak(second)).toBe(true);
		});

		it('handles trailing newlines without creating empty TextRuns', () => {
			const runs = textWithBreaks('Content\n');
			expect(runs).toHaveLength(1);
			const first = runs[0];
			if (!first) throw new Error('Expected first TextRun');
			expect(getText(first)).toBe('Content');
		});

		it('handles leading newlines', () => {
			const runs = textWithBreaks('\nContent');
			expect(runs).toHaveLength(1);
			const first = runs[0];
			if (!first) throw new Error('Expected first TextRun');
			expect(hasBreak(first)).toBe(true);
		});
	});

	describe('single newlines (\\n)', () => {
		it('preserves single newline as line break within summary paragraph', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'First sentence.\nSecond sentence on new line.',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Should have: Name heading, Summary heading, Summary content (1 paragraph)
			expect(paragraphs.length).toBeGreaterThanOrEqual(3);

			// Count line breaks in the summary content paragraph
			// Skip first 2 (Name, Summary heading)
			const summaryParagraphs = paragraphs.slice(2);
			const breaks = countLineBreaks(summaryParagraphs);
			expect(breaks).toBe(1);
		});
	});

	describe('double newlines (\\n\\n)', () => {
		it('creates separate paragraphs for double newlines in summary', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Paragraph one.\n\nParagraph two.',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Should have: Name heading (1), Summary heading (1), Summary paragraphs (2)
			// Total: 4
			expect(paragraphs.length).toBe(4);
		});

		it('handles triple+ newlines same as double', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Paragraph one.\n\n\n\nParagraph two.',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Triple/quad newlines still create just 2 paragraphs
			expect(paragraphs.length).toBe(4);
		});
	});

	describe('bullet items with newlines', () => {
		it('handles bullet text with internal single newline', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				experience: {
					en: [
						{
							company: 'Test Co',
							role: 'Developer',
							startDate: '2020-01',
							endDate: '2023-12',
							bullets: ['Main point\nSupporting detail'],
						},
					],
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Find bullet paragraph by checking text content contains bullet character
			const bulletParagraphs = paragraphs.filter((p) => {
				const texts = extractText([p]);
				return texts.some((t) => t.startsWith('\u2022'));
			});

			expect(bulletParagraphs.length).toBe(1);

			// The bullet should have a line break
			const breaks = countLineBreaks(bulletParagraphs);
			expect(breaks).toBe(1);
		});

		it('preserves multiple lines in bullet content', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				experience: {
					en: [
						{
							company: 'Test Co',
							role: 'Developer',
							startDate: '2020-01',
							endDate: '2023-12',
							bullets: ['Line 1\nLine 2\nLine 3'],
						},
					],
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			const bulletParagraphs = paragraphs.filter((p) => {
				const texts = extractText([p]);
				return texts.some((t) => t.startsWith('\u2022'));
			});

			// Should have 2 line breaks (for 3 lines)
			const breaks = countLineBreaks(bulletParagraphs);
			expect(breaks).toBe(2);
		});
	});

	describe('summary section', () => {
		it('splits summary on double newlines into separate paragraphs', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'First paragraph content.\n\nSecond paragraph content.\n\nThird paragraph.',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Name (1) + Summary heading (1) + 3 summary paragraphs = 5
			expect(paragraphs.length).toBe(5);
		});

		it('preserves single newlines within summary paragraphs', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Line 1 of para 1\nLine 2 of para 1\n\nLine 1 of para 2\nLine 2 of para 2',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Name (1) + Summary heading (1) + 2 summary paragraphs = 4
			expect(paragraphs.length).toBe(4);

			// Each summary paragraph should have 1 line break (2 lines each)
			const summaryContent = paragraphs.slice(2); // Skip Name and Summary heading
			const totalBreaks = countLineBreaks(summaryContent);
			expect(totalBreaks).toBe(2); // 1 break per paragraph
		});
	});

	describe('edge cases', () => {
		it('handles Windows-style newlines (\\r\\n) in summary', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Windows line\r\nbreaks here',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Should normalize to single line break
			const summaryContent = paragraphs.slice(2);
			const breaks = countLineBreaks(summaryContent);
			expect(breaks).toBe(1);
		});

		it('handles mixed newlines (\\n and \\r\\n)', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Unix line\nWindows line\r\nMore content',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			const summaryContent = paragraphs.slice(2);
			const breaks = countLineBreaks(summaryContent);
			expect(breaks).toBe(2); // 2 line breaks for 3 lines
		});

		it('trims trailing newlines without extra breaks', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Content with trailing\n\n',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Should be 1 summary paragraph (trailing newlines trimmed)
			expect(paragraphs.length).toBe(3); // Name + Summary heading + 1 content
		});

		it('handles empty lines between content', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				summary: {
					en: 'Before\n\n\n\nAfter',
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Multiple empty lines still create just 2 paragraphs
			expect(paragraphs.length).toBe(4); // Name + Summary heading + 2 content
		});

		it('preserves education notes with newlines', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				education: {
					en: [
						{
							institution: 'University',
							degree: 'BS',
							startDate: '2015-09',
							endDate: '2019-05',
							notes: 'Note line 1\nNote line 2',
						},
					],
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			// Find notes paragraph by content
			const notesParagraphs = paragraphs.filter((p) => {
				const texts = extractText([p]);
				return texts.some((t) => t.includes('Note line'));
			});

			expect(notesParagraphs.length).toBe(1);
			const breaks = countLineBreaks(notesParagraphs);
			expect(breaks).toBe(1);
		});

		it('preserves education honors with newlines', async () => {
			const cv: CVData = {
				contact: { name: 'Test User' },
				education: {
					en: [
						{
							institution: 'University',
							degree: 'BS',
							startDate: '2015-09',
							endDate: '2019-05',
							honors: 'Magna Cum Laude\nDeans List',
						},
					],
				},
			};

			const paragraphs = await buildDocumentContent(cv, 'en');

			const honorsParagraphs = paragraphs.filter((p) => {
				const texts = extractText([p]);
				return texts.some((t) => t.includes('Magna Cum'));
			});

			expect(honorsParagraphs.length).toBe(1);
			const breaks = countLineBreaks(honorsParagraphs);
			expect(breaks).toBe(1);
		});
	});
});
