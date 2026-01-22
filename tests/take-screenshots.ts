import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from '@playwright/test';

const TEST_HTML_PATH = path.resolve(
	__dirname,
	'../people/testuser/output/testuser_base_en.html',
);

const SCREENSHOT_DIR = path.resolve(
	__dirname,
	'../.planning/quick/004-add-light-dark-system-color-toggle-to-ht/screenshots',
);

async function takeScreenshots() {
	// Ensure screenshot directory exists
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

	const browser = await chromium.launch();

	// Light mode screenshot
	const lightPage = await browser.newPage();
	await lightPage.emulateMedia({ colorScheme: 'light' });
	await lightPage.goto(`file://${TEST_HTML_PATH}`);
	await lightPage.click('.theme-toggle'); // system -> light
	await lightPage.screenshot({
		path: path.join(SCREENSHOT_DIR, '01-light-mode.png'),
		fullPage: false,
		clip: { x: 0, y: 0, width: 900, height: 700 },
	});
	console.log('Screenshot: 01-light-mode.png');
	await lightPage.close();

	// Dark mode screenshot
	const darkPage = await browser.newPage();
	await darkPage.emulateMedia({ colorScheme: 'light' });
	await darkPage.goto(`file://${TEST_HTML_PATH}`);
	await darkPage.click('.theme-toggle'); // system -> light
	await darkPage.click('.theme-toggle'); // light -> dark
	await darkPage.screenshot({
		path: path.join(SCREENSHOT_DIR, '02-dark-mode.png'),
		fullPage: false,
		clip: { x: 0, y: 0, width: 900, height: 700 },
	});
	console.log('Screenshot: 02-dark-mode.png');
	await darkPage.close();

	// System mode (light preference) screenshot
	const systemLightPage = await browser.newPage();
	await systemLightPage.emulateMedia({ colorScheme: 'light' });
	await systemLightPage.goto(`file://${TEST_HTML_PATH}`);
	// Stay in system mode (default)
	await systemLightPage.screenshot({
		path: path.join(SCREENSHOT_DIR, '03-system-mode-light.png'),
		fullPage: false,
		clip: { x: 0, y: 0, width: 900, height: 700 },
	});
	console.log('Screenshot: 03-system-mode-light.png');
	await systemLightPage.close();

	// System mode (dark preference) screenshot
	const systemDarkPage = await browser.newPage();
	await systemDarkPage.emulateMedia({ colorScheme: 'dark' });
	await systemDarkPage.goto(`file://${TEST_HTML_PATH}`);
	// Stay in system mode (default)
	await systemDarkPage.screenshot({
		path: path.join(SCREENSHOT_DIR, '04-system-mode-dark.png'),
		fullPage: false,
		clip: { x: 0, y: 0, width: 900, height: 700 },
	});
	console.log('Screenshot: 04-system-mode-dark.png');
	await systemDarkPage.close();

	// Print mode screenshot (toggle should be hidden)
	const printPage = await browser.newPage();
	await printPage.goto(`file://${TEST_HTML_PATH}`);
	await printPage.emulateMedia({ media: 'print' });
	await printPage.screenshot({
		path: path.join(SCREENSHOT_DIR, '05-print-mode.png'),
		fullPage: false,
		clip: { x: 0, y: 0, width: 900, height: 700 },
	});
	console.log('Screenshot: 05-print-mode.png');
	await printPage.close();

	await browser.close();
	console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
}

takeScreenshots().catch(console.error);
