import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [
		['html', { open: 'never' }],
		['junit', { outputFile: 'test-results/junit.xml' }],
	],
	use: {
		baseURL: 'file://',
		trace: 'on-first-retry',
	},
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
			animations: 'disabled',
		},
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: {
					args: ['--font-render-hinting=none'],
				},
			},
		},
	],
});
