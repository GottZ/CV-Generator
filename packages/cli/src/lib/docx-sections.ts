/**
 * DOCX section content builders for CV generation.
 *
 * Transforms CVData sections into docx library Paragraph arrays with proper
 * Word built-in styles for Navigation Pane support.
 */

import type {
	CVData,
	Education,
	Link,
	SkillCategory,
	WorkExperience,
} from '@gottz/cv-core';
import { getSectionHeader } from '@gottz/cv-templates';
import {
	ExternalHyperlink,
	HeadingLevel,
	ImageRun,
	Paragraph,
	TextRun,
} from 'docx';
import sharp from 'sharp';

/**
 * Spacing constants in TWIPs (1 line ~ 240 TWIPs for 12pt text).
 */
const SPACING = {
	/** Space after name heading */
	afterName: 120,
	/** Space after contact/links line */
	afterContact: 240,
	/** Space before section heading */
	beforeSection: 360,
	/** Space after section heading */
	afterSection: 120,
	/** Space before entry (company/institution) */
	beforeEntry: 200,
	/** Space after date line */
	afterDateLine: 60,
	/** Space after bullet items */
	afterBullet: 60,
	/** Space after paragraph text */
	afterParagraph: 240,
	/** Space after skills category */
	afterCategory: 120,
};

/**
 * Common profile image file names to search for.
 */
const PROFILE_IMAGE_NAMES = [
	'profile.jpg',
	'profile.jpeg',
	'profile.png',
	'photo.jpg',
	'photo.jpeg',
	'photo.png',
	'avatar.jpg',
	'avatar.jpeg',
	'avatar.png',
];

/**
 * Maximum width for profile images in pixels.
 */
const PROFILE_IMAGE_MAX_WIDTH = 150;

/**
 * Map sharp format to docx image type.
 * Returns null for unsupported formats.
 */
function mapImageFormat(
	format: string | undefined,
): 'jpg' | 'png' | 'gif' | 'bmp' | null {
	switch (format) {
		case 'jpeg':
		case 'jpg':
			return 'jpg';
		case 'png':
			return 'png';
		case 'gif':
			return 'gif';
		case 'bmp':
			return 'bmp';
		default:
			return null;
	}
}

/**
 * Load an image for DOCX embedding with proper dimensions.
 *
 * Uses sharp to extract dimensions and scales to max width while
 * maintaining aspect ratio. Returns null if file doesn't exist or
 * dimensions cannot be determined (corrupt file).
 *
 * CRITICAL: Always provides transformation with width/height to avoid
 * corrupt DOCX files (RESEARCH.md Pitfall 1).
 *
 * @param imagePath - Absolute path to image file
 * @returns Paragraph with ImageRun or null if image cannot be loaded
 */
export async function loadImageForDocx(
	imagePath: string,
): Promise<Paragraph | null> {
	const file = Bun.file(imagePath);
	if (!(await file.exists())) {
		return null;
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const metadata = await sharp(buffer).metadata();

	// CRITICAL: Return null if dimensions missing (corrupt file)
	if (!metadata.width || !metadata.height) {
		return null;
	}

	// Map format to docx image type
	const imageType = mapImageFormat(metadata.format);
	if (!imageType) {
		// Unsupported format (SVG, WebP, etc.)
		return null;
	}

	// Scale to max width while maintaining aspect ratio
	const scale = Math.min(1, PROFILE_IMAGE_MAX_WIDTH / metadata.width);
	const scaledWidth = Math.round(metadata.width * scale);
	const scaledHeight = Math.round(metadata.height * scale);

	return new Paragraph({
		children: [
			new ImageRun({
				type: imageType,
				data: buffer,
				transformation: {
					width: scaledWidth,
					height: scaledHeight,
				},
				altText: {
					title: 'Profile photo',
					description: 'Candidate profile photograph',
					name: 'profile',
				},
			}),
		],
		spacing: { after: SPACING.afterContact },
	});
}

/**
 * Find and load profile image from images directory.
 *
 * Searches for common profile image names and returns the first match.
 */
async function findProfileImage(imagesDir: string): Promise<Paragraph | null> {
	for (const name of PROFILE_IMAGE_NAMES) {
		const imagePath = `${imagesDir}/${name}`;
		const paragraph = await loadImageForDocx(imagePath);
		if (paragraph) {
			return paragraph;
		}
	}
	return null;
}

/**
 * Build contact info line (email | phone | location).
 */
function buildContactLine(cv: CVData): Paragraph | null {
	const parts: string[] = [];

	if (cv.contact.email) {
		parts.push(cv.contact.email);
	}
	if (cv.contact.phone) {
		parts.push(cv.contact.phone);
	}
	if (cv.contact.location) {
		parts.push(cv.contact.location);
	}

	if (parts.length === 0) {
		return null;
	}

	return new Paragraph({
		children: [new TextRun({ text: parts.join(' | ') })],
		spacing: { after: SPACING.afterContact },
	});
}

/**
 * Build links line with clickable hyperlinks.
 */
function buildLinksLine(links: Link[]): Paragraph | null {
	if (links.length === 0) {
		return null;
	}

	const children: (TextRun | ExternalHyperlink)[] = [];

	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		if (!link) continue;

		const label = link.label ?? link.type;

		children.push(
			new ExternalHyperlink({
				children: [
					new TextRun({
						text: label,
						style: 'Hyperlink',
					}),
				],
				link: link.url,
			}),
		);

		// Add separator between links
		if (i < links.length - 1) {
			children.push(new TextRun({ text: ' | ' }));
		}
	}

	return new Paragraph({
		children,
		spacing: { after: SPACING.afterContact },
	});
}

/**
 * Build summary section paragraphs.
 */
function buildSummarySection(summary: string, locale: string): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			text: getSectionHeader('summary', locale),
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
		}),
	);

	// Summary text - split by double newlines for multiple paragraphs
	const summaryParagraphs = summary.split(/\n\n+/).filter((p) => p.trim());
	for (const text of summaryParagraphs) {
		paragraphs.push(
			new Paragraph({
				text: text.trim(),
				spacing: { after: SPACING.afterParagraph },
			}),
		);
	}

	return paragraphs;
}

/**
 * Build experience section paragraphs.
 */
function buildExperienceSection(
	experiences: WorkExperience[],
	locale: string,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			text: getSectionHeader('experience', locale),
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
		}),
	);

	for (const exp of experiences) {
		// Company | Role (bold company)
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({ text: exp.company, bold: true }),
					new TextRun({ text: ` | ${exp.role}` }),
				],
				spacing: { before: SPACING.beforeEntry },
			}),
		);

		// Dates | Location (italic)
		const dateParts: string[] = [];
		if (exp.startDate) {
			dateParts.push(exp.startDate);
		}
		if (exp.endDate) {
			dateParts.push(exp.endDate);
		}
		const dateStr = dateParts.join(' - ');
		const locationStr = exp.location ? ` | ${exp.location}` : '';

		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: `${dateStr}${locationStr}`,
						italics: true,
					}),
				],
				spacing: { after: SPACING.afterDateLine },
			}),
		);

		// Bullet highlights
		for (const bullet of exp.bullets) {
			paragraphs.push(
				new Paragraph({
					text: `\u2022 ${bullet}`,
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}
	}

	return paragraphs;
}

/**
 * Build education section paragraphs.
 */
function buildEducationSection(
	education: Education[],
	locale: string,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			text: getSectionHeader('education', locale),
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
		}),
	);

	for (const edu of education) {
		// Institution | Degree (bold institution)
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({ text: edu.institution, bold: true }),
					new TextRun({ text: ` | ${edu.degree}` }),
				],
				spacing: { before: SPACING.beforeEntry },
			}),
		);

		// Field (if present)
		if (edu.field) {
			paragraphs.push(
				new Paragraph({
					text: edu.field,
				}),
			);
		}

		// Dates | Location (italic)
		const dateParts: string[] = [];
		if (edu.startDate) {
			dateParts.push(edu.startDate);
		}
		if (edu.endDate) {
			dateParts.push(edu.endDate);
		}
		const dateStr = dateParts.join(' - ');
		const locationStr = edu.location ? ` | ${edu.location}` : '';

		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: `${dateStr}${locationStr}`,
						italics: true,
					}),
				],
				spacing: { after: SPACING.afterDateLine },
			}),
		);

		// Honors (if present)
		if (edu.honors) {
			paragraphs.push(
				new Paragraph({
					text: edu.honors,
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}

		// Notes (if present)
		if (edu.notes) {
			paragraphs.push(
				new Paragraph({
					text: edu.notes,
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}
	}

	return paragraphs;
}

/**
 * Build skills section paragraphs.
 */
function buildSkillsSection(
	skillCategories: SkillCategory[],
	locale: string,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			text: getSectionHeader('skills', locale),
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
		}),
	);

	for (const category of skillCategories) {
		// Category name (bold)
		paragraphs.push(
			new Paragraph({
				children: [new TextRun({ text: category.name, bold: true })],
				spacing: { before: SPACING.beforeEntry },
			}),
		);

		// Skills as bullet items
		for (const skill of category.skills) {
			const skillText = skill.level
				? `${skill.name} (${skill.level})`
				: skill.name;

			paragraphs.push(
				new Paragraph({
					text: `\u2022 ${skillText}`,
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}
	}

	return paragraphs;
}

/**
 * Build complete document content from CV data.
 *
 * Creates all CV sections with proper Word built-in styles:
 * - Name: Heading 1 (appears in Navigation Pane)
 * - Section headers: Heading 2 (appears in Navigation Pane)
 * - Body text: Normal style (default)
 *
 * Section order mirrors PDF output per CONTEXT.md:
 * 1. Name (Heading 1)
 * 2. Contact info (email | phone | location)
 * 3. Links (if present, as clickable text)
 * 4. Profile image (if present)
 * 5. Summary section
 * 6. Experience section
 * 7. Education section
 * 8. Skills section
 *
 * @param cv - CV data to render
 * @param locale - Locale for i18n section headers (en, de)
 * @param imagesDir - Optional directory containing profile images
 * @returns Array of Paragraph elements for document content
 */
export async function buildDocumentContent(
	cv: CVData,
	locale: string,
	imagesDir?: string,
): Promise<Paragraph[]> {
	const paragraphs: Paragraph[] = [];

	// 1. Name (Heading 1)
	paragraphs.push(
		new Paragraph({
			text: cv.contact.name,
			heading: HeadingLevel.HEADING_1,
			spacing: { after: SPACING.afterName },
		}),
	);

	// 2. Contact info
	const contactLine = buildContactLine(cv);
	if (contactLine) {
		paragraphs.push(contactLine);
	}

	// 3. Links
	if (cv.contact.links && cv.contact.links.length > 0) {
		const linksLine = buildLinksLine(cv.contact.links);
		if (linksLine) {
			paragraphs.push(linksLine);
		}
	}

	// 4. Profile image (if imagesDir provided)
	if (imagesDir) {
		const profileImage = await findProfileImage(imagesDir);
		if (profileImage) {
			paragraphs.push(profileImage);
		}
	}

	// 5. Summary section
	const summaryContent = cv.summary?.[locale];
	if (summaryContent) {
		paragraphs.push(...buildSummarySection(summaryContent, locale));
	}

	// 6. Experience section
	const experienceContent = cv.experience?.[locale];
	if (experienceContent && experienceContent.length > 0) {
		paragraphs.push(...buildExperienceSection(experienceContent, locale));
	}

	// 7. Education section
	const educationContent = cv.education?.[locale];
	if (educationContent && educationContent.length > 0) {
		paragraphs.push(...buildEducationSection(educationContent, locale));
	}

	// 8. Skills section
	const skillsContent = cv.skills?.[locale];
	if (skillsContent && skillsContent.length > 0) {
		paragraphs.push(...buildSkillsSection(skillsContent, locale));
	}

	return paragraphs;
}
