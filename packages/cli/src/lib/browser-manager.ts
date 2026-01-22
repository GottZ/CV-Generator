/**
 * Browser lifecycle management for Puppeteer PDF generation.
 *
 * Uses singleton pattern to reuse browser instance across multiple PDF
 * generations in the same session, saving ~300-800ms per PDF.
 */
import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';

let browser: Browser | null = null;

/**
 * Get or launch a Puppeteer browser instance.
 *
 * If a browser is already running and connected, returns the existing instance.
 * Otherwise launches a new headless browser with sandbox disabled.
 *
 * @returns Promise<Browser> - Puppeteer browser instance
 */
export async function getBrowser(): Promise<Browser> {
	// Check if existing browser is still connected (handles crashes)
	if (browser?.connected) {
		return browser;
	}

	// Launch new browser with ATS-optimized settings
	browser = await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			// Disable GPU for headless stability
			'--disable-gpu',
			// Reduce memory usage
			'--disable-dev-shm-usage',
		],
	});

	return browser;
}

/**
 * Close the browser instance if it exists.
 *
 * Should be called when PDF generation session is complete
 * to free resources and prevent memory leaks.
 */
export async function closeBrowser(): Promise<void> {
	if (browser) {
		await browser.close();
		browser = null;
	}
}
