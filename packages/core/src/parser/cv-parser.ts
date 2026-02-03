import type {
	Certification,
	CVData,
	Education,
	Localized,
	ParseError,
	ParseResult,
	Project,
	ProjectLink,
	SkillCategory,
	WorkExperience,
} from '../schema/index.ts';
import { parseFrontmatter } from './frontmatter.ts';
import { extractSections, type SectionMatch } from './sections.ts';

/** Type for certification parser context including warnings */
interface CertificationParseContext {
	warnings: ParseError[];
	startLine: number;
}

/**
 * Parse a complete CV markdown file into structured CVData.
 *
 * Per CONTEXT.md:
 * - Missing sections are skipped silently (DATA-09)
 * - Unknown sections trigger warning but parsing continues (DATA-10)
 * - All errors collected before returning (not fail-fast)
 */
export function parseCV(markdown: string): ParseResult<CVData> {
	const errors: ParseError[] = [];
	const warnings: ParseError[] = [];

	// Step 1: Extract frontmatter (contact info)
	const frontmatterResult = parseFrontmatter(markdown);
	errors.push(...frontmatterResult.errors);

	// Step 2: Extract sections with language tags
	const sectionsResult = extractSections(frontmatterResult.content);
	warnings.push(...sectionsResult.warnings);

	// Step 3: Group sections by type and language
	const summary = buildLocalizedSection<string>(
		sectionsResult.sections,
		'summary',
		(content) => content.trim(),
	);

	const experience = buildLocalizedSection<WorkExperience[]>(
		sectionsResult.sections,
		'experience',
		parseExperienceEntries,
	);

	const education = buildLocalizedSection<Education[]>(
		sectionsResult.sections,
		'education',
		parseEducationEntries,
	);

	const skills = buildLocalizedSection<SkillCategory[]>(
		sectionsResult.sections,
		'skills',
		parseSkillCategories,
	);

	const projects = buildLocalizedSection<Project[]>(
		sectionsResult.sections,
		'projects',
		parseProjectEntries,
	);

	// Certifications are NOT localized (cert names are universal)
	// Parse all certification sections and collect warnings
	const certifications: Certification[] = [];
	for (const section of sectionsResult.sections) {
		if (section.sectionType === 'certifications' && section.content) {
			const context: CertificationParseContext = {
				warnings,
				startLine: section.line,
			};
			certifications.push(
				...parseCertificationEntries(section.content, context),
			);
		}
	}

	// Step 4: Validate tech-to-skills consistency
	validateTechToSkills(experience, skills, warnings);

	// Build CVData if no errors (warnings are OK)
	const data: CVData | null =
		errors.length === 0 && frontmatterResult.contact
			? {
					contact: frontmatterResult.contact,
					...(Object.keys(summary).length > 0 && { summary }),
					...(Object.keys(experience).length > 0 && { experience }),
					...(Object.keys(education).length > 0 && { education }),
					...(Object.keys(skills).length > 0 && { skills }),
					...(Object.keys(projects).length > 0 && { projects }),
					...(certifications.length > 0 && { certifications }),
				}
			: null;

	return { data, errors, warnings };
}

/**
 * Build a localized section from matched sections.
 */
function buildLocalizedSection<T>(
	sections: SectionMatch[],
	sectionType: string,
	parser: (content: string) => T,
): Localized<T> {
	const result: Localized<T> = {};

	for (const section of sections) {
		if (section.sectionType === sectionType && section.content) {
			result[section.language] = parser(section.content);
		}
	}

	return result;
}

/** Regex for tech stack header detection (case-insensitive) */
const TECH_STACK_HEADER = /^####\s+(technologies|tech stack)\s*$/i;

/** Regex for links header detection (case-insensitive) */
const LINKS_HEADER = /^####\s+links\s*$/i;

/**
 * Parse work experience entries separated by ---.
 * Supports optional #### Technologies or #### Tech Stack subsections.
 */
function parseExperienceEntries(content: string): WorkExperience[] {
	// Split by --- delimiter (entry separator per CONTEXT.md)
	const entries = content.split(/^---$/m).filter((e) => e.trim());

	return entries.map((entry) => {
		const lines = entry.trim().split('\n');
		const experience: WorkExperience = {
			company: '',
			role: '',
			startDate: '',
			endDate: '',
			bullets: [],
		};

		// Track whether we're currently inside a tech stack subsection
		let inTechStack = false;
		const techStack: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim();

			// Check for tech stack header: #### Technologies or #### Tech Stack
			if (TECH_STACK_HEADER.test(trimmed)) {
				inTechStack = true;
				continue;
			}

			// If in tech stack mode, collect tech items
			if (inTechStack) {
				// Exit tech stack mode on next section header or empty content
				if (trimmed.startsWith('#') || trimmed === '') {
					inTechStack = false;
				} else if (trimmed.startsWith('- ')) {
					// Tech item (may have role annotation like "React (lead)")
					techStack.push(trimmed.slice(2).trim());
					continue;
				}
			}

			// ### Role at/bei Company (supports both English "at" and German "bei")
			if (trimmed.startsWith('### ')) {
				const headerMatch = trimmed.match(/^###\s+(.+?)\s+(?:at|bei)\s+(.+)$/i);
				if (headerMatch) {
					experience.role = (headerMatch[1] ?? '').trim();
					experience.company = (headerMatch[2] ?? '').trim();
				} else {
					// Fallback: use entire header as role
					experience.role = trimmed.slice(4).trim();
				}
			}
			// *dates | location* format
			else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
				const metaContent = trimmed.slice(1, -1);
				const parts = metaContent.split('|').map((p) => p.trim());

				if (parts[0]) {
					const dateMatch = parts[0].match(
						/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/,
					);
					if (dateMatch) {
						experience.startDate = dateMatch[1] ?? '';
						experience.endDate = (dateMatch[2] ?? '').trim();
					}
				}
				if (parts[1]) {
					experience.location = parts[1];
				}
			}
			// - bullet point (not in tech stack mode)
			else if (trimmed.startsWith('- ') && !inTechStack) {
				experience.bullets.push(trimmed.slice(2));
			}
		}

		// Add techStack if any items were collected
		if (techStack.length > 0) {
			experience.techStack = techStack;
		}

		return experience;
	});
}

/**
 * Parse education entries separated by ---.
 */
function parseEducationEntries(content: string): Education[] {
	const entries = content.split(/^---$/m).filter((e) => e.trim());

	return entries.map((entry) => {
		const lines = entry.trim().split('\n');
		const education: Education = {
			institution: '',
			degree: '',
			startDate: '',
			endDate: '',
		};

		for (const line of lines) {
			const trimmed = line.trim();

			// ### Degree at/bei Institution (supports both English "at" and German "bei")
			if (trimmed.startsWith('### ')) {
				const headerMatch = trimmed.match(/^###\s+(.+?)\s+(?:at|bei)\s+(.+)$/i);
				if (headerMatch) {
					education.degree = (headerMatch[1] ?? '').trim();
					education.institution = (headerMatch[2] ?? '').trim();
				} else {
					education.degree = trimmed.slice(4).trim();
				}
			}
			// *dates | location* or *field*
			else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
				const metaContent = trimmed.slice(1, -1);

				// Check if it's a date line or field line
				if (metaContent.includes('-') && /\d{4}/.test(metaContent)) {
					const parts = metaContent.split('|').map((p) => p.trim());
					if (parts[0]) {
						const dateMatch = parts[0].match(
							/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/,
						);
						if (dateMatch) {
							education.startDate = dateMatch[1] ?? '';
							education.endDate = (dateMatch[2] ?? '').trim();
						}
					}
					if (parts[1]) {
						education.location = parts[1];
					}
				} else {
					// Assume it's the field of study
					education.field = metaContent;
				}
			}
			// Honors/notes as regular text
			else if (trimmed && !trimmed.startsWith('#')) {
				if (!education.notes) {
					education.notes = trimmed;
				} else {
					education.notes += `\n${trimmed}`;
				}
			}
		}

		return education;
	});
}

/** Known proficiency levels (not acronyms) */
const PROFICIENCY_LEVELS = new Set([
	// English levels
	'expert',
	'proficient',
	'familiar',
	'advanced',
	'beginner',
	'intermediate',
	// German levels
	'experte',
	'fortgeschritten',
	'grundkenntnisse',
	'anfänger',
	// Role annotations (not levels but also not acronyms)
	'lead',
	'supporting',
]);

/**
 * Check if parenthetical content is an acronym (not a proficiency level).
 * Acronyms: 2-5 uppercase letters, or alphanumeric patterns like K8s, S3, EC2.
 *
 * @param text - The text inside parentheses
 * @returns true if text appears to be an acronym
 */
function isAcronym(text: string): boolean {
	const lower = text.toLowerCase();
	if (PROFICIENCY_LEVELS.has(lower)) {
		return false;
	}

	// Acronyms: all caps 2-5 chars (e.g., AWS, GCP, K8S)
	// or K8s/S3/EC2 patterns (letter + digit + optional letter)
	return /^[A-Z0-9]{2,5}$/.test(text) || /^[A-Z][0-9][a-z]?$/.test(text);
}

/**
 * Parse skills into categories.
 * Expected format:
 * ### Category Name
 * - Skill 1
 * - Skill 2 (level)
 * - Skill 3 (acronym) -> keeps full name
 */
function parseSkillCategories(content: string): SkillCategory[] {
	const categories: SkillCategory[] = [];
	let currentCategory: SkillCategory | null = null;

	for (const line of content.split('\n')) {
		const trimmed = line.trim();

		// ### Category Name
		if (trimmed.startsWith('### ')) {
			if (currentCategory) {
				categories.push(currentCategory);
			}
			currentCategory = {
				name: trimmed.slice(4).trim(),
				skills: [],
			};
		}
		// - Skill (optional level or acronym)
		else if (trimmed.startsWith('- ') && currentCategory) {
			const skillText = trimmed.slice(2);
			// Check for parentheses at end
			const levelMatch = skillText.match(/^(.+?)\s*\(([^)]+)\)$/);
			if (levelMatch) {
				const base = (levelMatch[1] ?? '').trim();
				const paren = (levelMatch[2] ?? '').trim();

				if (isAcronym(paren)) {
					// Keep full format: "Kubernetes (K8s)" -> name: "Kubernetes (K8s)", no level
					currentCategory.skills.push({ name: skillText });
				} else {
					// Proficiency level: "TypeScript (expert)" -> name: "TypeScript", level: "expert"
					currentCategory.skills.push({ name: base, level: paren });
				}
			} else {
				currentCategory.skills.push({ name: skillText });
			}
		}
	}

	if (currentCategory) {
		categories.push(currentCategory);
	}

	return categories;
}

/**
 * Parse project entries separated by ---.
 * Supports optional #### Technologies, #### Tech Stack, and #### Links subsections.
 *
 * Expected markdown format:
 * ### Project Name
 * *2023-01 - present | Lead Developer | open-source*
 *
 * Project description here.
 *
 * #### Technologies
 * - React
 * - TypeScript
 *
 * #### Links
 * - github: https://github.com/user/repo
 * - demo: https://example.com
 *
 * **Outcome:** Result achieved
 */
function parseProjectEntries(content: string): Project[] {
	const entries = content.split(/^---$/m).filter((e) => e.trim());

	const projects = entries.map((entry) => {
		const lines = entry.trim().split('\n');
		const project: Project = { name: '' };

		// Track which subsection we're in
		let inTechStack = false;
		let inLinks = false;
		const techStack: string[] = [];
		const links: ProjectLink[] = [];
		const descriptionLines: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim();

			// Check for tech stack header
			if (TECH_STACK_HEADER.test(trimmed)) {
				inTechStack = true;
				inLinks = false;
				continue;
			}

			// Check for links header
			if (LINKS_HEADER.test(trimmed)) {
				inLinks = true;
				inTechStack = false;
				continue;
			}

			// Exit subsection on new header
			if (trimmed.startsWith('####')) {
				inTechStack = false;
				inLinks = false;
				continue;
			}

			// **Outcome:** text - check before subsection content (can appear after links)
			if (trimmed.startsWith('**Outcome:**')) {
				inTechStack = false;
				inLinks = false;
				project.outcome = trimmed.slice(12).trim();
				continue;
			}

			// Parse subsection content
			if (inTechStack) {
				if (trimmed.startsWith('- ')) {
					techStack.push(trimmed.slice(2).trim());
				}
				continue;
			}

			if (inLinks) {
				if (trimmed.startsWith('- ')) {
					const linkContent = trimmed.slice(2).trim();
					const link = parseLinkLine(linkContent);
					if (link) {
						links.push(link);
					}
				}
				continue;
			}

			// ### Project Name
			if (trimmed.startsWith('### ')) {
				project.name = trimmed.slice(4).trim();
			}
			// *dates | role | type | highlight* format
			else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
				const metaContent = trimmed.slice(1, -1);
				parseProjectMeta(metaContent, project);
			}
			// Regular text is description (collect until subsection)
			else if (trimmed && !trimmed.startsWith('#')) {
				descriptionLines.push(trimmed);
			}
		}

		// Set collected fields
		if (techStack.length > 0) {
			project.techStack = techStack;
		}
		if (links.length > 0) {
			project.links = links;
		}
		if (descriptionLines.length > 0) {
			project.description = descriptionLines.join('\n');
		}

		return project;
	});

	// Sort: highlighted first, then by startDate descending (newest first)
	return projects.sort((a, b) => {
		// Highlighted projects come first
		if (a.highlight && !b.highlight) return -1;
		if (!a.highlight && b.highlight) return 1;

		// Then sort by startDate (newest first)
		if (a.startDate && b.startDate) {
			return b.startDate.localeCompare(a.startDate);
		}
		// Projects with dates come before those without
		if (a.startDate && !b.startDate) return -1;
		if (!a.startDate && b.startDate) return 1;

		// Maintain original order if no dates
		return 0;
	});
}

/**
 * Parse a link line in format: "type: url" or just "url"
 */
function parseLinkLine(content: string): ProjectLink | null {
	// Format: "type: url" (e.g., "github: https://github.com/user/repo")
	const typedMatch = content.match(/^(\w+):\s*(.+)$/);
	if (typedMatch) {
		const type = (typedMatch[1] ?? '').toLowerCase();
		const url = (typedMatch[2] ?? '').trim();
		if (url) {
			return { url, type };
		}
	}

	// Format: just URL
	if (content.startsWith('http://') || content.startsWith('https://')) {
		return { url: content };
	}

	return null;
}

/**
 * Parse project meta line: *dates | role | type | highlight*
 * Parts are pipe-separated, order-independent by content detection.
 */
function parseProjectMeta(meta: string, project: Project): void {
	const parts = meta.split('|').map((p) => p.trim());

	for (const part of parts) {
		// Check for "highlight" flag
		if (part.toLowerCase() === 'highlight') {
			project.highlight = true;
			continue;
		}

		// Check for project type
		const projectTypes = [
			'personal',
			'professional',
			'open-source',
			'freelance',
		];
		if (projectTypes.includes(part.toLowerCase())) {
			project.type = part.toLowerCase() as Project['type'];
			continue;
		}

		// Check for date range (YYYY-MM - YYYY-MM or YYYY-MM - present)
		const dateMatch = part.match(/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/);
		if (dateMatch) {
			project.startDate = dateMatch[1] ?? '';
			project.endDate = (dateMatch[2] ?? '').trim();
			continue;
		}

		// Anything else is likely the role
		if (part && !project.role) {
			project.role = part;
		}
	}
}

/**
 * Parse certification entries separated by ---.
 * Adds warnings for expired certifications.
 *
 * Expected markdown format:
 * ### AWS Solutions Architect - Associate
 * *Amazon Web Services | 2023-05 | expires 2026-05*
 *
 * Credential ID: ABC123
 * https://verify.aws.com/ABC123
 */
function parseCertificationEntries(
	content: string,
	context: CertificationParseContext,
): Certification[] {
	const entries = content.split(/^---$/m).filter((e) => e.trim());
	let lineOffset = 0;

	return entries.map((entry) => {
		const lines = entry.trim().split('\n');
		const cert: Certification = { name: '', issuer: '', date: '' };
		const entryStartLine = context.startLine + lineOffset;

		for (const line of lines) {
			const trimmed = line.trim();
			lineOffset++;

			// ### Certification Name
			if (trimmed.startsWith('### ')) {
				cert.name = trimmed.slice(4).trim();
			}
			// *issuer | date | expires expiryDate* format
			else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
				const metaContent = trimmed.slice(1, -1);
				parseCertificationMeta(metaContent, cert);
			}
			// Credential ID: XXX
			else if (trimmed.toLowerCase().startsWith('credential id:')) {
				cert.credentialId = trimmed.slice(14).trim();
			}
			// Standalone URL is verification URL
			else if (
				trimmed.startsWith('http://') ||
				trimmed.startsWith('https://')
			) {
				cert.verificationUrl = trimmed;
			}
		}

		// Add separator lines to offset
		lineOffset++;

		// Check for expired certification
		if (cert.expiryDate) {
			const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
			// Compare dates (handles both YYYY-MM and YYYY-MM-DD formats)
			if (cert.expiryDate < today) {
				context.warnings.push({
					type: 'warning',
					line: entryStartLine,
					message: `Certification "${cert.name}" has expired (${cert.expiryDate})`,
					suggestion: 'Consider removing or noting the expiration status',
				});
			}
		}

		return cert;
	});
}

/**
 * Parse certification meta line: *issuer | date | expires expiryDate*
 */
function parseCertificationMeta(meta: string, cert: Certification): void {
	const parts = meta.split('|').map((p) => p.trim());

	for (const part of parts) {
		// Check for expiry date (format: "expires YYYY-MM" or "expires YYYY-MM-DD")
		const expiryMatch = part.match(/^expires?\s+(\d{4}-\d{2}(?:-\d{2})?)$/i);
		if (expiryMatch) {
			cert.expiryDate = expiryMatch[1] ?? '';
			continue;
		}

		// Check for date (YYYY-MM or YYYY-MM-DD without "expires")
		const dateMatch = part.match(/^(\d{4}-\d{2}(?:-\d{2})?)$/);
		if (dateMatch) {
			cert.date = dateMatch[1] ?? '';
			continue;
		}

		// First non-date part is issuer
		if (part && !cert.issuer) {
			cert.issuer = part;
		}
	}
}

/**
 * Validate that technologies listed in experience are also in skills section.
 * Warns when a tech is used in experience but not listed in skills.
 *
 * @param experience - Localized experience data
 * @param skills - Localized skills data
 * @param warnings - Array to push warnings to
 */
function validateTechToSkills(
	experience: Localized<WorkExperience[]>,
	skills: Localized<SkillCategory[]>,
	warnings: ParseError[],
): void {
	// Collect all tech from experience (use first locale for validation)
	const allTechUsed = new Set<string>();
	const experienceContent = experience[Object.keys(experience)[0] ?? ''] ?? [];
	for (const exp of experienceContent) {
		for (const tech of exp.techStack ?? []) {
			// Strip role annotation for matching: "React (lead)" -> "React"
			const techName = tech.replace(/\s*\([^)]+\)$/, '').trim();
			allTechUsed.add(techName.toLowerCase());
		}
	}

	// Collect all skill names (use first locale for validation)
	const allSkillNames = new Set<string>();
	const skillsContent = skills[Object.keys(skills)[0] ?? ''] ?? [];
	for (const category of skillsContent) {
		for (const skill of category.skills) {
			// Handle both formats: "Kubernetes (K8s)" and "TypeScript"
			const skillName = skill.name.replace(/\s*\([^)]+\)$/, '').trim();
			allSkillNames.add(skillName.toLowerCase());
		}
	}

	// Warn on tech not in skills
	for (const tech of allTechUsed) {
		if (!allSkillNames.has(tech)) {
			warnings.push({
				type: 'warning',
				message: `Technology "${tech}" used in experience but not listed in Skills section`,
				suggestion:
					'Consider adding this skill to your Skills section for consistency',
			});
		}
	}
}
