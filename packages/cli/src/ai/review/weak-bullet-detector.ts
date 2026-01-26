/**
 * Weak bullet detection for CV content.
 * Identifies bullets lacking impact, metrics, or strong action verbs.
 * Source: Phase 17 AI User Control (AI-14)
 */

import pc from 'picocolors';

/**
 * Types of weaknesses that can be detected in CV bullets.
 */
export type WeaknessType =
	| 'lacks_quantification'
	| 'missing_outcome'
	| 'too_generic'
	| 'passive_voice';

/**
 * Human-readable explanations for each weakness type.
 */
export const WEAKNESS_REASONS: Record<WeaknessType, string> = {
	lacks_quantification: 'Missing numbers, percentages, or metrics',
	missing_outcome: 'Describes activity without result or impact',
	too_generic: 'Uses weak verbs or filler phrases',
	passive_voice: 'Uses passive voice instead of active verbs',
};

/**
 * Patterns for detecting generic/weak verbs and phrases.
 */
const GENERIC_PATTERNS = [
	/\bhelped\b/i,
	/\bworked on\b/i,
	/\bassisted\b/i,
	/\bwas involved\b/i,
	/\bparticipated\b/i,
	/\bcontributed to\b/i,
	/\bsupported\b/i,
];

/**
 * Patterns for detecting passive voice constructions.
 */
const PASSIVE_PATTERNS = [
	/\bwas responsible\b/i,
	/\bwere tasked\b/i,
	/\bbeen assigned\b/i,
	/\bwas given\b/i,
	/\bwere assigned\b/i,
	/\bwas tasked\b/i,
];

/**
 * Patterns for detecting outcome/result words.
 */
const OUTCOME_PATTERNS = [
	/\bachieved\b/i,
	/\bimproved\b/i,
	/\breduced\b/i,
	/\bincreased\b/i,
	/\bdelivered\b/i,
	/\blaunched\b/i,
	/\bsaved\b/i,
	/\bgenerated\b/i,
	/\bcompleted\b/i,
	/\bbuilt\b/i,
	/\bcreated\b/i,
	/\bdesigned\b/i,
	/\bimplemented\b/i,
	/\bdeveloped\b/i,
	/\bestablished\b/i,
	/\bresulted\b/i,
	/\benabled\b/i,
	/\boptimized\b/i,
	/\bstreamlined\b/i,
	/\bautomated\b/i,
];

/**
 * Pattern for detecting quantification (numbers, percentages, metrics).
 */
const QUANTIFICATION_PATTERN =
	/\d+|\d+%|[$]\d+|million|billion|thousand|hours?|days?|weeks?|months?|years?|team of|cross-functional/i;

/**
 * Detect weakness in a CV bullet point.
 * Returns the first weakness found, or null if the bullet is strong.
 *
 * Detection order (first match wins):
 * 1. Passive voice - structural issue
 * 2. Too generic - weak verbs
 * 3. Missing outcome - no result/impact words
 * 4. Lacks quantification - no numbers/metrics
 */
export function detectWeakness(bullet: string): WeaknessType | null {
	// Check for passive voice first (structural issue)
	for (const pattern of PASSIVE_PATTERNS) {
		if (pattern.test(bullet)) {
			return 'passive_voice';
		}
	}

	// Check for generic/weak verbs
	for (const pattern of GENERIC_PATTERNS) {
		if (pattern.test(bullet)) {
			return 'too_generic';
		}
	}

	// Check for outcome words
	let hasOutcome = false;
	for (const pattern of OUTCOME_PATTERNS) {
		if (pattern.test(bullet)) {
			hasOutcome = true;
			break;
		}
	}

	if (!hasOutcome) {
		return 'missing_outcome';
	}

	// Check for quantification
	if (!QUANTIFICATION_PATTERN.test(bullet)) {
		return 'lacks_quantification';
	}

	return null;
}

/**
 * Display a weak bullet with inline warning.
 * Format: [!] Bullet text -- Weakness reason
 */
export function displayWeakBulletWarning(
	bullet: string,
	weakness: WeaknessType,
): void {
	const warning = pc.yellow('[!]');
	const reason = pc.dim(`-- ${WEAKNESS_REASONS[weakness]}`);
	console.log(`${warning} ${bullet} ${reason}`);
}
