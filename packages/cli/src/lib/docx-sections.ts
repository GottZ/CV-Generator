/**
 * DOCX section content builders for CV generation.
 *
 * Transforms CVData sections into docx library Paragraph arrays with proper
 * Word built-in styles for Navigation Pane support.
 *
 * Linebreak behavior in DOCX:
 * - Single \n: Creates line break within paragraph (TextRun with break: true)
 * - Double \n\n: Creates separate paragraphs
 * - Bullets: Content after bullet marker respects single newlines
 * - Windows \r\n: Normalized to \n for consistent handling
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
	AlignmentType,
	ExternalHyperlink,
	HeadingLevel,
	ImageRun,
	Paragraph,
	TextRun,
} from 'docx';
import sharp from 'sharp';
import {
	DEFAULT_DOCX_STYLES,
	type DocxStyleConfig,
} from './docx-style-extractor.ts';

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
 * Options for textWithBreaks formatting.
 */
interface TextRunOptions {
	bold?: boolean;
	italics?: boolean;
	size?: number;
	color?: string;
	font?: string;
}

/**
 * Convert text with newlines to array of TextRuns.
 *
 * Single \n becomes a line break within the paragraph (TextRun with break: 1).
 * Use for content that should stay in one paragraph but have visual line breaks.
 *
 * Normalizes Windows newlines (\r\n) to Unix newlines (\n).
 * Skips empty lines to avoid empty TextRuns.
 *
 * @param text - Text that may contain newlines
 * @param options - Optional formatting (bold, italics, size, color, font)
 * @returns Array of TextRun objects
 */
export function textWithBreaks(
	text: string,
	options?: TextRunOptions,
): TextRun[] {
	// Normalize Windows newlines
	const normalized = text.replace(/\r\n/g, '\n');
	const lines = normalized.split('\n');
	const runs: TextRun[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const trimmed = line.trim();

		// Skip empty lines
		if (!trimmed) continue;

		if (i > 0 || (i === 0 && normalized.startsWith('\n'))) {
			// Add line break before this line (except first non-empty line unless leading newline)
			// Check if this is the first non-empty line after empty ones
			const hasNonEmptyBefore = lines.slice(0, i).some((l) => l.trim());
			if (hasNonEmptyBefore || normalized.startsWith('\n')) {
				runs.push(
					new TextRun({
						text: trimmed,
						break: 1,
						...options,
					}),
				);
				continue;
			}
		}

		// First line or line without break
		runs.push(
			new TextRun({
				text: trimmed,
				...options,
			}),
		);
	}

	return runs;
}

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
 * Contact info is left-aligned per HTML flexbox layout.
 */
function buildContactLine(
	cv: CVData,
	styles: DocxStyleConfig,
): Paragraph | null {
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
		alignment: AlignmentType.LEFT,
		children: [
			new TextRun({
				text: parts.join(' | '),
				size: styles.fontSizes.body,
				color: styles.colors.muted,
				font: styles.fonts.body,
			}),
		],
		spacing: { after: SPACING.afterContact },
	});
}

/**
 * Build links line with clickable hyperlinks.
 * Links are left-aligned per HTML flexbox layout.
 */
function buildLinksLine(
	links: Link[],
	styles: DocxStyleConfig,
): Paragraph | null {
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
						size: styles.fontSizes.body,
						color: styles.colors.accent,
						font: styles.fonts.body,
					}),
				],
				link: link.url,
			}),
		);

		// Add separator between links
		if (i < links.length - 1) {
			children.push(
				new TextRun({
					text: ' | ',
					size: styles.fontSizes.body,
					color: styles.colors.muted,
					font: styles.fonts.body,
				}),
			);
		}
	}

	return new Paragraph({
		alignment: AlignmentType.LEFT,
		children,
		spacing: { after: SPACING.afterContact },
	});
}

/**
 * Build summary section paragraphs.
 */
function buildSummarySection(
	summary: string,
	locale: string,
	styles: DocxStyleConfig,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
			children: [
				new TextRun({
					text: getSectionHeader('summary', locale),
					size: styles.fontSizes.section,
					color: styles.colors.heading,
					font: styles.fonts.heading,
					bold: true,
				}),
			],
		}),
	);

	// Summary text - split by double newlines for multiple paragraphs
	// Within each paragraph, single newlines become line breaks
	const summaryParagraphs = summary.split(/\n\n+/).filter((p) => p.trim());
	for (const text of summaryParagraphs) {
		paragraphs.push(
			new Paragraph({
				children: textWithBreaks(text.trim(), {
					size: styles.fontSizes.body,
					color: styles.colors.body,
					font: styles.fonts.body,
				}),
				spacing: { after: SPACING.afterParagraph },
			}),
		);
	}

	return paragraphs;
}

/**
 * Build experience section paragraphs.
 * Date ranges are right-aligned per HTML entry-header space-between layout.
 */
function buildExperienceSection(
	experiences: WorkExperience[],
	locale: string,
	styles: DocxStyleConfig,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
			children: [
				new TextRun({
					text: getSectionHeader('experience', locale),
					size: styles.fontSizes.section,
					color: styles.colors.heading,
					font: styles.fonts.heading,
					bold: true,
				}),
			],
		}),
	);

	for (const exp of experiences) {
		// Company | Role (bold company)
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: exp.company,
						bold: true,
						size: styles.fontSizes.subsection,
						color: styles.colors.heading,
						font: styles.fonts.heading,
					}),
					new TextRun({
						text: ` | ${exp.role}`,
						size: styles.fontSizes.body,
						color: styles.colors.body,
						font: styles.fonts.body,
					}),
				],
				spacing: { before: SPACING.beforeEntry },
			}),
		);

		// Dates | Location (italic, right-aligned)
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
				alignment: AlignmentType.RIGHT,
				children: [
					new TextRun({
						text: `${dateStr}${locationStr}`,
						italics: true,
						size: styles.fontSizes.small,
						color: styles.colors.muted,
						font: styles.fonts.body,
					}),
				],
				spacing: { after: SPACING.afterDateLine },
			}),
		);

		// Bullet highlights - single newlines within bullets become line breaks
		for (const bullet of exp.bullets) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: '\u2022 ',
							size: styles.fontSizes.body,
							color: styles.colors.body,
							font: styles.fonts.body,
						}),
						...textWithBreaks(bullet, {
							size: styles.fontSizes.body,
							color: styles.colors.body,
							font: styles.fonts.body,
						}),
					],
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}
	}

	return paragraphs;
}

/**
 * Build education section paragraphs.
 * Date ranges are right-aligned per HTML entry-header space-between layout.
 */
function buildEducationSection(
	education: Education[],
	locale: string,
	styles: DocxStyleConfig,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
			children: [
				new TextRun({
					text: getSectionHeader('education', locale),
					size: styles.fontSizes.section,
					color: styles.colors.heading,
					font: styles.fonts.heading,
					bold: true,
				}),
			],
		}),
	);

	for (const edu of education) {
		// Institution | Degree (bold institution)
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: edu.institution,
						bold: true,
						size: styles.fontSizes.subsection,
						color: styles.colors.heading,
						font: styles.fonts.heading,
					}),
					new TextRun({
						text: ` | ${edu.degree}`,
						size: styles.fontSizes.body,
						color: styles.colors.body,
						font: styles.fonts.body,
					}),
				],
				spacing: { before: SPACING.beforeEntry },
			}),
		);

		// Field (if present)
		if (edu.field) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: edu.field,
							size: styles.fontSizes.body,
							color: styles.colors.body,
							font: styles.fonts.body,
						}),
					],
				}),
			);
		}

		// Dates | Location (italic, right-aligned)
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
				alignment: AlignmentType.RIGHT,
				children: [
					new TextRun({
						text: `${dateStr}${locationStr}`,
						italics: true,
						size: styles.fontSizes.small,
						color: styles.colors.muted,
						font: styles.fonts.body,
					}),
				],
				spacing: { after: SPACING.afterDateLine },
			}),
		);

		// Honors (if present) - single newlines become line breaks
		if (edu.honors) {
			paragraphs.push(
				new Paragraph({
					children: textWithBreaks(edu.honors, {
						italics: true,
						size: styles.fontSizes.small,
						color: styles.colors.muted,
						font: styles.fonts.body,
					}),
					spacing: { after: SPACING.afterBullet },
				}),
			);
		}

		// Notes (if present) - single newlines become line breaks
		if (edu.notes) {
			paragraphs.push(
				new Paragraph({
					children: textWithBreaks(edu.notes, {
						size: styles.fontSizes.small,
						color: styles.colors.body,
						font: styles.fonts.body,
					}),
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
	styles: DocxStyleConfig,
): Paragraph[] {
	const paragraphs: Paragraph[] = [];

	// Section header (Heading 2)
	paragraphs.push(
		new Paragraph({
			heading: HeadingLevel.HEADING_2,
			spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
			children: [
				new TextRun({
					text: getSectionHeader('skills', locale),
					size: styles.fontSizes.section,
					color: styles.colors.heading,
					font: styles.fonts.heading,
					bold: true,
				}),
			],
		}),
	);

	for (const category of skillCategories) {
		// Category name (bold)
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: category.name,
						bold: true,
						size: styles.fontSizes.body,
						color: styles.colors.heading,
						font: styles.fonts.body,
					}),
				],
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
					children: [
						new TextRun({
							text: `\u2022 ${skillText}`,
							size: styles.fontSizes.small,
							color: styles.colors.body,
							font: styles.fonts.body,
						}),
					],
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
 * @param styles - Optional style configuration (defaults to DEFAULT_DOCX_STYLES)
 * @returns Array of Paragraph elements for document content
 */
export async function buildDocumentContent(
	cv: CVData,
	locale: string,
	imagesDir?: string,
	styles?: DocxStyleConfig,
): Promise<Paragraph[]> {
	const paragraphs: Paragraph[] = [];
	const s = styles ?? DEFAULT_DOCX_STYLES;

	// 1. Name (Heading 1)
	paragraphs.push(
		new Paragraph({
			heading: HeadingLevel.HEADING_1,
			spacing: { after: SPACING.afterName },
			children: [
				new TextRun({
					text: cv.contact.name,
					size: s.fontSizes.name,
					color: s.colors.heading,
					font: s.fonts.heading,
					bold: true,
				}),
			],
		}),
	);

	// 2. Contact info (left-aligned per HTML flexbox)
	const contactLine = buildContactLine(cv, s);
	if (contactLine) {
		paragraphs.push(contactLine);
	}

	// 3. Links (left-aligned per HTML flexbox)
	if (cv.contact.links && cv.contact.links.length > 0) {
		const linksLine = buildLinksLine(cv.contact.links, s);
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
		paragraphs.push(...buildSummarySection(summaryContent, locale, s));
	}

	// 6. Experience section
	const experienceContent = cv.experience?.[locale];
	if (experienceContent && experienceContent.length > 0) {
		paragraphs.push(...buildExperienceSection(experienceContent, locale, s));
	}

	// 7. Education section
	const educationContent = cv.education?.[locale];
	if (educationContent && educationContent.length > 0) {
		paragraphs.push(...buildEducationSection(educationContent, locale, s));
	}

	// 8. Skills section
	const skillsContent = cv.skills?.[locale];
	if (skillsContent && skillsContent.length > 0) {
		paragraphs.push(...buildSkillsSection(skillsContent, locale, s));
	}

	return paragraphs;
}
