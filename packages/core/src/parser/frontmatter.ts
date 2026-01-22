import matter from 'gray-matter';
import type { Contact, Link, ParseError } from '../schema/index.ts';

interface FrontmatterResult {
	contact: Contact | null;
	content: string;
	errors: ParseError[];
}

/**
 * Extract and validate contact info from YAML frontmatter.
 * Returns remaining markdown content (body) for section parsing.
 */
export function parseFrontmatter(markdown: string): FrontmatterResult {
	const errors: ParseError[] = [];

	try {
		const { data, content } = matter(markdown);

		// Validate required field: name
		if (!data.name || typeof data.name !== 'string') {
			errors.push({
				type: 'error',
				message: 'Missing required field: name',
				suggestion: 'Add "name: Your Name" to frontmatter',
			});
		}

		// Build contact object
		const contact: Contact | null =
			errors.length === 0
				? {
						name: data.name as string,
						email: data.email as string | undefined,
						phone: data.phone as string | undefined,
						location: data.location as string | undefined,
						links: parseLinks(data.links),
						slug: data.slug as string | undefined,
					}
				: null;

		return { contact, content, errors };
	} catch (err) {
		errors.push({
			type: 'error',
			message: `Failed to parse frontmatter: ${err instanceof Error ? err.message : 'Unknown error'}`,
			suggestion: 'Check YAML syntax in frontmatter block',
		});
		return { contact: null, content: '', errors };
	}
}

/**
 * Parse links array from frontmatter.
 * Accepts array of { type, url, label? } objects.
 */
function parseLinks(links: unknown): Link[] | undefined {
	if (!Array.isArray(links)) return undefined;

	return links
		.filter(
			(link): link is Record<string, unknown> =>
				typeof link === 'object' && link !== null,
		)
		.map((link) => ({
			type: String(link.type || 'unknown'),
			url: String(link.url || ''),
			label: link.label ? String(link.label) : undefined,
		}))
		.filter((link) => link.url); // Filter out empty URLs
}
