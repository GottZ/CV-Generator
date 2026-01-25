/**
 * ATS Text Extraction Tests.
 *
 * Verifies that PDF text can be extracted and read by Applicant Tracking Systems.
 * This is critical for the project's core value of ATS-parseable CVs.
 *
 * Tests verify:
 * - Candidate name, title, and summary are extractable
 * - Work experience (companies, job titles) is readable
 * - Skills section content is accessible
 * - Education details can be parsed
 * - Ligature disabling works (words like "efficient" extract correctly)
 *
 * Requirements covered:
 * - TEST-02: ATS text extraction verification
 */

import { expect, test } from '@playwright/test';
import {
	cleanupTestOutput,
	generateTestCv,
	type TestCvResult,
} from './helpers/test-generator';
import { extractTextFromPdf } from './helpers/text-extraction';

test.describe('ATS Text Extraction', () => {
	// Run tests sequentially since they share generated CVs
	test.describe.configure({ mode: 'serial' });

	// Store generated CV result
	let result: TestCvResult;
	let extractedText: string;

	test.beforeAll(async () => {
		// Generate test CV with modern template
		result = await generateTestCv({
			template: 'modern',
			fixture: 'sample-cv',
		});

		// Extract text once for all tests
		const extraction = await extractTextFromPdf(result.pdf);
		extractedText = extraction.text;
	});

	test.afterAll(async () => {
		await cleanupTestOutput();
	});

	test('extracts candidate name from PDF', async () => {
		// Test User is the name in sample-cv.md fixture
		expect(extractedText).toContain('Test User');
	});

	test('extracts professional title/summary', async () => {
		// Verify job title is extractable
		expect(extractedText).toContain('Senior Software Engineer');

		// Verify key summary phrases
		expect(extractedText).toContain('years of experience');
		expect(extractedText).toContain('scalable web applications');
	});

	test('extracts work experience', async () => {
		// Company names from sample-cv.md
		expect(extractedText).toContain('TechCorp Solutions');
		expect(extractedText).toContain('StartupXYZ');

		// Job titles
		expect(extractedText).toContain('Software Developer');

		// Key achievements should be readable
		expect(extractedText).toContain('microservices architecture');
		expect(extractedText).toContain('daily active users');
	});

	test('extracts skills correctly', async () => {
		// Programming languages from sample-cv.md
		expect(extractedText).toContain('TypeScript');
		expect(extractedText).toContain('JavaScript');
		expect(extractedText).toContain('Python');

		// Frameworks
		expect(extractedText).toContain('React');
		expect(extractedText).toContain('Node.js');

		// Databases
		expect(extractedText).toContain('PostgreSQL');
		expect(extractedText).toContain('MongoDB');
		expect(extractedText).toContain('Redis');
	});

	test('ligature words extract correctly', async () => {
		// Test words that commonly have ligatures (fi, fl, ff sequences)
		// These should NOT be mangled by ligature glyphs
		// The PDF generator disables ligatures with font-variant-ligatures: none

		// "Proficient" contains "fi" - a common ligature sequence
		// This word appears in the skills section of sample-cv.md
		expect(extractedText).toContain('Proficient');

		// "notification" contains "fi" - another fi ligature test
		// This word appears in the work experience section
		expect(extractedText).toContain('notification');

		// Verify these words are complete, not broken by ligature glyphs
		// If ligatures were rendering as single glyphs, "fi" would be missing
		expect(extractedText).toMatch(/Proficient/);
		expect(extractedText).toMatch(/notification/);
	});

	test('extracts education section', async () => {
		// University from sample-cv.md
		expect(extractedText).toContain('University of Texas at Austin');

		// Degree
		expect(extractedText).toContain('Bachelor of Science');

		// Field of study
		expect(extractedText).toContain('Computer Science');
	});
});
