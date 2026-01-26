/**
 * AI display utilities for content comparison and quality indicators.
 */

// cv.md output formatting
export {
	type FormatBulletsOptions,
	formatBulletsAsCvMd,
	formatCompleteCvMd,
	formatKeywordsAsCvMd,
	formatSummaryAsCvMd,
	type KeywordPlacement,
	type RoleBullet,
	type RoleBullets,
	type StarBreakdown,
} from './cv-format.ts';

// Diff display
export {
	displayComparison,
	displayInlineDiff,
	displaySideBySide,
} from './diff-display.ts';

// Quality labels
export {
	formatKeywordScore,
	formatMatchScore,
	formatPriority,
	formatQualityLabel,
	type Quality,
} from './quality-labels.ts';
