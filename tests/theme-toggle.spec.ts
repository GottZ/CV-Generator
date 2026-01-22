import * as path from 'node:path';
import { expect, test } from '@playwright/test';

const TEST_HTML_PATH = path.resolve(
	__dirname,
	'../people/testuser/output/testuser_base_en.html',
);

test.describe('Theme toggle', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the test HTML file
		await page.goto(`file://${TEST_HTML_PATH}`);
	});

	test('initial load defaults to system preference', async ({ page }) => {
		// Should default to system mode
		const theme = await page.evaluate(() =>
			document.documentElement.getAttribute('data-theme'),
		);
		expect(theme).toBe('system');
	});

	test('click cycles through themes: system -> light -> dark -> system', async ({
		page,
	}) => {
		const toggle = page.locator('.theme-toggle');

		// Initial state should be system
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');

		// Click 1: system -> light
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		// Click 2: light -> dark
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Click 3: dark -> system
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
	});

	test('light mode shows correct icon', async ({ page }) => {
		const toggle = page.locator('.theme-toggle');
		await toggle.click(); // Go to light mode

		// Sun icon should be visible, others hidden
		await expect(page.locator('.theme-icon[data-icon="light"]')).toBeVisible();
		await expect(
			page.locator('.theme-icon[data-icon="dark"]'),
		).not.toBeVisible();
		await expect(
			page.locator('.theme-icon[data-icon="system"]'),
		).not.toBeVisible();
	});

	test('dark mode shows correct icon', async ({ page }) => {
		const toggle = page.locator('.theme-toggle');
		await toggle.click(); // system -> light
		await toggle.click(); // light -> dark

		// Moon icon should be visible, others hidden
		await expect(page.locator('.theme-icon[data-icon="dark"]')).toBeVisible();
		await expect(
			page.locator('.theme-icon[data-icon="light"]'),
		).not.toBeVisible();
		await expect(
			page.locator('.theme-icon[data-icon="system"]'),
		).not.toBeVisible();
	});

	test('theme persists in localStorage across page reload', async ({
		page,
	}) => {
		const toggle = page.locator('.theme-toggle');

		// Set to dark mode
		await toggle.click(); // system -> light
		await toggle.click(); // light -> dark

		// Verify localStorage has the value
		const storedTheme = await page.evaluate(() =>
			localStorage.getItem('cv-theme'),
		);
		expect(storedTheme).toBe('dark');

		// Reload the page
		await page.reload();

		// Theme should persist
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('system mode removes localStorage entry', async ({ page }) => {
		const toggle = page.locator('.theme-toggle');

		// Set to light mode first
		await toggle.click(); // system -> light

		// Verify localStorage has a value
		let storedTheme = await page.evaluate(() =>
			localStorage.getItem('cv-theme'),
		);
		expect(storedTheme).toBe('light');

		// Cycle back to system
		await toggle.click(); // light -> dark
		await toggle.click(); // dark -> system

		// localStorage should be cleared
		storedTheme = await page.evaluate(() => localStorage.getItem('cv-theme'));
		expect(storedTheme).toBeNull();
	});

	test('system preference respected when in system mode - dark', async ({
		page,
	}) => {
		// Emulate dark system preference
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.reload();

		// Should still be in system mode
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');

		// Background should be dark (check cv-page background)
		const bgColor = await page.evaluate(() => {
			const cvPage = document.querySelector('.cv-page');
			return cvPage ? getComputedStyle(cvPage).backgroundColor : null;
		});

		// Dark mode background is #1f2937 = rgb(31, 41, 55)
		expect(bgColor).toBe('rgb(31, 41, 55)');
	});

	test('system preference respected when in system mode - light', async ({
		page,
	}) => {
		// Emulate light system preference
		await page.emulateMedia({ colorScheme: 'light' });
		await page.reload();

		// Should still be in system mode
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');

		// Background should be light (check cv-page background)
		const bgColor = await page.evaluate(() => {
			const cvPage = document.querySelector('.cv-page');
			return cvPage ? getComputedStyle(cvPage).backgroundColor : null;
		});

		// Light mode background is #ffffff = rgb(255, 255, 255)
		expect(bgColor).toBe('rgb(255, 255, 255)');
	});

	test('explicit light mode overrides dark system preference', async ({
		page,
	}) => {
		// Emulate dark system preference
		await page.emulateMedia({ colorScheme: 'dark' });

		const toggle = page.locator('.theme-toggle');
		await toggle.click(); // system -> light

		// Should be in light mode
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		// Background should be light despite dark system preference
		const bgColor = await page.evaluate(() => {
			const cvPage = document.querySelector('.cv-page');
			return cvPage ? getComputedStyle(cvPage).backgroundColor : null;
		});

		expect(bgColor).toBe('rgb(255, 255, 255)');
	});

	test('explicit dark mode overrides light system preference', async ({
		page,
	}) => {
		// Emulate light system preference
		await page.emulateMedia({ colorScheme: 'light' });

		const toggle = page.locator('.theme-toggle');
		await toggle.click(); // system -> light
		await toggle.click(); // light -> dark

		// Should be in dark mode
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Background should be dark despite light system preference
		const bgColor = await page.evaluate(() => {
			const cvPage = document.querySelector('.cv-page');
			return cvPage ? getComputedStyle(cvPage).backgroundColor : null;
		});

		// Dark mode background is #1f2937 = rgb(31, 41, 55)
		expect(bgColor).toBe('rgb(31, 41, 55)');
	});

	test('toggle button is hidden in print mode', async ({ page }) => {
		// Emulate print media
		await page.emulateMedia({ media: 'print' });

		// Toggle should not be visible
		await expect(page.locator('.theme-toggle')).not.toBeVisible();
	});

	test('toggle button has accessible aria-label', async ({ page }) => {
		const toggle = page.locator('.theme-toggle');

		// Initial system mode aria-label
		await expect(toggle).toHaveAttribute(
			'aria-label',
			'Current: system preference. Click to switch to light mode.',
		);

		// After clicking to light mode
		await toggle.click();
		await expect(toggle).toHaveAttribute(
			'aria-label',
			'Current: light mode. Click to switch to dark mode.',
		);

		// After clicking to dark mode
		await toggle.click();
		await expect(toggle).toHaveAttribute(
			'aria-label',
			'Current: dark mode. Click to switch to system preference.',
		);
	});
});
