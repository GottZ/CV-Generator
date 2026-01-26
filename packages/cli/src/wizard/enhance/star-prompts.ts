/**
 * STAR-method guidance for experience bullet prompts.
 * Per WIZ-19: Show examples and STAR hints to guide better bullets.
 */

import pc from 'picocolors';

/**
 * Role types for STAR example categorization.
 */
export type RoleType =
	| 'engineering'
	| 'management'
	| 'sales'
	| 'design'
	| 'general';

/**
 * STAR example bullets by role type.
 * Each example demonstrates situation, action, and quantified result.
 */
export const STAR_EXAMPLES: Record<RoleType, string[]> = {
	engineering: [
		'Reduced API latency by 40% by implementing Redis caching layer, improving user experience for 50K daily users',
		'Led migration of 15 microservices to Kubernetes, achieving 99.9% uptime and 30% cost reduction',
		'Designed real-time notification system handling 1M+ events/day with <100ms delivery latency',
	],
	management: [
		'Grew engineering team from 5 to 15 engineers while maintaining sprint velocity, reducing time-to-hire by 25%',
		'Implemented quarterly OKR process that increased team goal completion rate from 60% to 85%',
		'Mentored 4 junior developers to senior level within 18 months through structured 1:1 program',
	],
	sales: [
		'Exceeded annual quota by 140% ($2.4M) by developing strategic account expansion framework',
		'Shortened sales cycle from 90 to 45 days by implementing consultative selling methodology',
		'Built and managed partner channel generating 35% of regional revenue within first year',
	],
	design: [
		'Redesigned checkout flow increasing conversion rate by 23% through A/B tested iteration',
		'Established design system adopted by 8 product teams, reducing component dev time by 40%',
		'Led user research program with 200+ interviews informing product roadmap priorities',
	],
	general: [
		'Streamlined reporting process by automating Excel workflows, saving 10 hours weekly across team',
		'Increased customer satisfaction score from 3.5 to 4.2 by redesigning support ticket workflow',
		'Reduced project delivery time by 20% through implementation of agile standup practices',
	],
};

/**
 * Keywords for role type detection.
 */
const ROLE_KEYWORDS: Record<RoleType, string[]> = {
	engineering: [
		'engineer',
		'developer',
		'programmer',
		'architect',
		'devops',
		'sre',
		'backend',
		'frontend',
		'fullstack',
		'software',
		'data',
		'ml',
		'ai',
	],
	management: [
		'manager',
		'director',
		'lead',
		'head',
		'vp',
		'chief',
		'principal',
		'team lead',
		'engineering manager',
	],
	sales: [
		'sales',
		'account',
		'business development',
		'bd',
		'revenue',
		'customer success',
	],
	design: [
		'designer',
		'ux',
		'ui',
		'product design',
		'visual',
		'graphic',
		'creative',
	],
	general: [], // Fallback
};

/**
 * Detect role type from job title.
 */
export function detectRoleType(role: string): RoleType {
	const normalized = role.toLowerCase();

	for (const [type, keywords] of Object.entries(ROLE_KEYWORDS) as Array<
		[RoleType, string[]]
	>) {
		if (type === 'general') continue;
		if (keywords.some((kw) => normalized.includes(kw))) {
			return type;
		}
	}

	return 'general';
}

/**
 * Show STAR example before bullet prompt.
 * Uses different example each time to show variety.
 */
export function showStarExample(roleType: RoleType, bulletIndex: number): void {
	const examples = STAR_EXAMPLES[roleType];
	const exampleIndex = bulletIndex % examples.length;
	const example = examples[exampleIndex];

	if (example) {
		console.log(pc.dim(`\n  Example: ${example}`));
	}
}

/**
 * Get STAR guidance text for prompt message.
 */
export function getStarGuidance(): string {
	return 'describe your achievement - think: situation, what you did, outcome';
}
