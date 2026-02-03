import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Convert a person's name to a URL-safe directory slug.
 * Per CONTEXT.md: "John Doe" -> "john-doe"
 *
 * @param name - The person's name (e.g., "John Doe" or "john-doe")
 * @returns Slugified name suitable for directory name
 */
export function slugifyName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Create a placeholder photo image for CV scaffolding.
 * Per CONTEXT.md: solid color square with "PHOTO" text.
 *
 * Uses SVG overlay for text rendering as per RESEARCH.md Pattern 5.
 *
 * @returns JPEG buffer of placeholder image (200x250, gray background)
 */
export async function createPlaceholderPhoto(): Promise<Buffer> {
	const width = 200;
	const height = 250;

	// Create SVG with gray background and centered text
	const svg = `<svg width="${width}" height="${height}">
		<rect width="100%" height="100%" fill="#CCCCCC"/>
		<text x="50%" y="50%" font-family="sans-serif" font-size="24"
			fill="#666666" text-anchor="middle" dominant-baseline="middle">PHOTO</text>
	</svg>`;

	return sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 204, g: 204, b: 204, alpha: 1 },
		},
	})
		.composite([{ input: Buffer.from(svg), gravity: 'center' }])
		.jpeg({ quality: 90 })
		.toBuffer();
}

/**
 * Create example CV markdown with inline comments explaining each section.
 * Per CONTEXT.md: Commented guide with EN and DE examples for all core sections.
 *
 * @returns Example markdown content for cv.md
 */
export function createExampleMarkdown(): string {
	return `---
# Contact Information (required)
name: Your Name
email: your.email@example.com
# phone: +1 234 567 8900  # Optional
# location: City, Country  # Optional
# slug: your-name  # Optional: used for output filenames
photo: ./images/photo.jpg  # Optional: your photo

# Links (optional array)
# links:
#   - url: https://linkedin.com/in/yourprofile
#     label: LinkedIn
#   - url: https://github.com/yourusername
#     label: GitHub
---

## Profile \`en\`
<!-- Professional profile in English (2-3 sentences) -->
Experienced professional with expertise in...

## Profil \`de\`
<!-- Berufsprofil auf Deutsch (2-3 Saetze) -->
Erfahrener Fachmann mit Expertise in...

## Experience \`en\`
<!-- Work experience entries. Each entry starts with ### -->

### Job Title at Company Name
*January 2020 - Present | City, Country*

- Key achievement or responsibility
- Another accomplishment with measurable results
- Technical skills or leadership demonstrated

---

### Previous Role at Another Company
*June 2017 - December 2019 | City, Country*

- Description of responsibilities
- Notable projects or achievements

## Berufserfahrung \`de\`
<!-- Berufserfahrung auf Deutsch -->

### Position bei Firmenname
*Januar 2020 - Heute | Stadt, Land*

- Wichtige Leistung oder Verantwortung
- Weitere Erfolge mit messbaren Ergebnissen

---

### Vorherige Position bei Anderer Firma
*Juni 2017 - Dezember 2019 | Stadt, Land*

- Beschreibung der Verantwortlichkeiten
- Bemerkenswerte Projekte oder Erfolge

## Education \`en\`
<!-- Education entries -->

### Degree Name
*University Name | 2013 - 2017*

Field of Study
<!-- Optional: honors, GPA, thesis topic -->

## Ausbildung \`de\`

### Abschlussbezeichnung
*Universitaet Name | 2013 - 2017*

Studienfach

## Skills \`en\`
<!-- Skills organized by category -->

### Languages
- JavaScript
- TypeScript
- Python

### Frameworks
- React
- Node.js
- Express

### Tools
- Git
- Docker
- AWS

## Kenntnisse \`de\`

### Sprachen
- JavaScript
- TypeScript
- Python

### Frameworks
- React
- Node.js
- Express

### Werkzeuge
- Git
- Docker
- AWS
`;
}

/**
 * Create a new CV directory structure with example content.
 * Per CONTEXT.md: Do NOT create output directory (build creates it).
 *
 * Creates:
 * - {personDir}/cv.md - Example CV markdown with inline comments
 * - {personDir}/images/photo.jpg - Placeholder photo
 *
 * @param personDir - Full path to the person's directory (e.g., /path/to/people/john-doe)
 */
export async function createCvDirectory(personDir: string): Promise<void> {
	// Create directories
	const imagesDir = path.join(personDir, 'images');
	await mkdir(imagesDir, { recursive: true });

	// Write example markdown
	const cvPath = path.join(personDir, 'cv.md');
	await writeFile(cvPath, createExampleMarkdown(), 'utf-8');

	// Write placeholder photo
	const photoPath = path.join(imagesDir, 'photo.jpg');
	const photoBuffer = await createPlaceholderPhoto();
	await writeFile(photoPath, photoBuffer);
}
