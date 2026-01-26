/**
 * Display helpers for workflow status and context commands.
 * Provides consistent formatting for terminal, JSON, and markdown output.
 */

import Table from 'cli-table3';
import pc from 'picocolors';
import type { WorkflowStage, WorkflowState } from './types.ts';
import { STAGE_ORDER } from './types.ts';

interface StageInfo {
	name: string;
	key: WorkflowStage;
	command: string;
}

const STAGES: StageInfo[] = [
	{ name: 'Analyze', key: 'analyzed', command: 'cvgen ai analyze' },
	{ name: 'Improve', key: 'improved', command: 'cvgen ai improve' },
	{ name: 'Summarize', key: 'summarized', command: 'cvgen ai summarize' },
	{ name: 'Tailor', key: 'tailored', command: 'cvgen ai tailor --job <file>' },
];

/**
 * Format workflow status as a terminal table.
 *
 * @param state - Current workflow state
 * @param personName - Name of the person for display
 * @returns Formatted terminal output
 */
export function formatStatus(state: WorkflowState, personName: string): string {
	const lines: string[] = [];

	lines.push(pc.bold(`Workflow Status: ${personName}`));
	lines.push('');

	const table = new Table({
		head: ['Stage', 'Status', 'Completed'],
		style: { head: ['cyan'] },
	});

	const currentStageIndex = STAGE_ORDER.indexOf(state.currentStage);

	for (const stage of STAGES) {
		const completed = state.completedAt[stage.key];
		const stageIndex = STAGE_ORDER.indexOf(stage.key);

		// Determine if this is the next stage to run
		const isNext = stageIndex === currentStageIndex + 1;

		let statusCell: string;
		if (completed) {
			statusCell = pc.green('Complete');
		} else if (isNext) {
			statusCell = pc.yellow('Next');
		} else {
			statusCell = pc.dim('Pending');
		}

		const nameCell = isNext ? pc.cyan(`> ${stage.name}`) : stage.name;
		const completedCell = completed ? formatTimestamp(completed) : '-';

		table.push([nameCell, statusCell, completedCell]);
	}

	lines.push(table.toString());

	// Show next command hint
	const nextStageIndex = currentStageIndex + 1;
	const nextStage = STAGES[nextStageIndex];
	if (nextStage) {
		lines.push('');
		lines.push(`Next: ${pc.cyan(`${nextStage.command} ${personName}`)}`);
	} else {
		lines.push('');
		lines.push(pc.green('All stages complete!'));
	}

	return lines.join('\n');
}

/**
 * Format workflow status as JSON for scripting.
 *
 * @param state - Current workflow state
 * @returns JSON-serializable object
 */
export function formatStatusJson(state: WorkflowState): object {
	return {
		currentStage: state.currentStage,
		completedAt: state.completedAt,
		lastUpdated: state.lastUpdated,
		stages: STAGES.map((stage) => ({
			name: stage.name,
			key: stage.key,
			completed: !!state.completedAt[stage.key],
			completedAt: state.completedAt[stage.key] || null,
		})),
	};
}

/**
 * Format list of available sections from analyze results.
 *
 * @param state - Current workflow state
 * @returns Formatted terminal output
 */
export function formatSectionList(state: WorkflowState): string {
	const lines: string[] = [];

	if (!state.stageResults.analyze) {
		return pc.yellow('No sections analyzed yet. Run analyze stage first.');
	}

	const sections = state.stageResults.analyze.sections;
	const improvedCount = state.stageResults.improve
		? state.stageResults.improve.jobImprovements.length
		: 0;

	lines.push(pc.bold('Available Sections:'));
	lines.push(`${sections.length} sections analyzed, ${improvedCount} improved`);
	lines.push('');

	for (const section of sections) {
		const statusColor =
			section.status === 'strong'
				? pc.green
				: section.status === 'needs_improvement'
					? pc.yellow
					: pc.red;
		lines.push(`  ${pc.cyan(section.name)} - ${statusColor(section.status)}`);
	}

	return lines.join('\n');
}

/**
 * Format context details for a specific section.
 *
 * @param state - Current workflow state
 * @param sectionName - Name of section to show
 * @param verbose - Whether to show full stage history
 * @returns Formatted terminal output
 * @throws Error if section not found
 */
export function formatSectionContext(
	state: WorkflowState,
	sectionName: string,
	verbose: boolean,
): string {
	const lines: string[] = [];

	if (!state.stageResults.analyze) {
		throw new Error(
			`Section '${sectionName}' not analyzed yet.\nRun \`cvgen ai analyze\` first.`,
		);
	}

	// Find section (case-insensitive exact match)
	const section = state.stageResults.analyze.sections.find(
		(s) => s.name.toLowerCase() === sectionName.toLowerCase(),
	);

	if (!section) {
		const availableSections = state.stageResults.analyze.sections.map(
			(s) => s.name,
		);
		throw new Error(
			`Section '${sectionName}' not found.\n` +
				`Available sections: ${availableSections.join(', ')}`,
		);
	}

	// Show latest analysis by default
	lines.push(pc.bold(`Section: ${section.name}`));
	lines.push('');

	// Analysis result
	lines.push(pc.cyan('Analysis:'));
	const statusColor =
		section.status === 'strong'
			? pc.green
			: section.status === 'needs_improvement'
				? pc.yellow
				: pc.red;
	lines.push(`  Status: ${statusColor(section.status)}`);
	lines.push(`  Bullets: ${section.bulletCount}`);
	if (section.issues.length > 0) {
		lines.push('  Issues:');
		for (const issue of section.issues) {
			lines.push(`    - ${issue}`);
		}
	}

	// Show improvements if available and this section has any
	if (state.stageResults.improve) {
		const improvements = state.stageResults.improve.jobImprovements.find(
			(j) =>
				j.company.toLowerCase().includes(sectionName.toLowerCase()) ||
				j.role.toLowerCase().includes(sectionName.toLowerCase()),
		);

		if (improvements) {
			lines.push('');
			lines.push(pc.cyan('Improvements:'));
			for (const bullet of improvements.bullets) {
				lines.push(`  Original: ${pc.dim(bullet.original)}`);
				lines.push(`  Improved: ${pc.green(bullet.improved)}`);
				lines.push(`  Reason: ${pc.dim(bullet.reasoning)}`);
				lines.push('');
			}
		}
	}

	// Verbose mode: show all stage history
	if (verbose) {
		lines.push('');
		lines.push(pc.dim('--- Stage History ---'));

		if (state.stageResults.summarize) {
			lines.push('');
			lines.push(pc.cyan('Summary:'));
			lines.push(`  ${state.stageResults.summarize.primary}`);
		}

		if (state.stageResults.tailor) {
			lines.push('');
			lines.push(pc.cyan('Tailoring:'));
			lines.push(`  Match Score: ${state.stageResults.tailor.matchScore}%`);
		}
	}

	return lines.join('\n');
}

/**
 * Format section context as JSON for scripting.
 *
 * @param state - Current workflow state
 * @param sectionName - Name of section to show
 * @returns JSON-serializable object
 * @throws Error if section not found
 */
export function formatSectionContextJson(
	state: WorkflowState,
	sectionName: string,
): object {
	if (!state.stageResults.analyze) {
		throw new Error(`Section '${sectionName}' not analyzed yet.`);
	}

	const section = state.stageResults.analyze.sections.find(
		(s) => s.name.toLowerCase() === sectionName.toLowerCase(),
	);

	if (!section) {
		throw new Error(`Section '${sectionName}' not found.`);
	}

	return {
		section: section.name,
		analysis: section,
		improvements:
			state.stageResults.improve?.jobImprovements.filter(
				(j) =>
					j.company.toLowerCase().includes(sectionName.toLowerCase()) ||
					j.role.toLowerCase().includes(sectionName.toLowerCase()),
			) || [],
	};
}

/**
 * Format section context as Markdown.
 *
 * @param state - Current workflow state
 * @param sectionName - Name of section to show
 * @returns Markdown-formatted string
 * @throws Error if section not found
 */
export function formatSectionContextMarkdown(
	state: WorkflowState,
	sectionName: string,
): string {
	if (!state.stageResults.analyze) {
		throw new Error(`Section '${sectionName}' not analyzed yet.`);
	}

	const section = state.stageResults.analyze.sections.find(
		(s) => s.name.toLowerCase() === sectionName.toLowerCase(),
	);

	if (!section) {
		throw new Error(`Section '${sectionName}' not found.`);
	}

	const lines: string[] = [];
	lines.push(`## ${section.name}`);
	lines.push('');
	lines.push(`**Status:** ${section.status}`);
	lines.push(`**Bullets:** ${section.bulletCount}`);

	if (section.issues.length > 0) {
		lines.push('');
		lines.push('### Issues');
		for (const issue of section.issues) {
			lines.push(`- ${issue}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format ISO timestamp to locale string.
 */
function formatTimestamp(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleString();
}
