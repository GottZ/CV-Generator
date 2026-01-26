/**
 * Skills by category prompt flow.
 * Collects skills organized by category (Languages, Frameworks, etc.).
 */

import type { Skill, SkillCategory } from '@gottz/cv-core';
import { confirm, input, Separator, select } from '@inquirer/prompts';
import pc from 'picocolors';

import type { WizardMode } from '../types.ts';

/**
 * Common skill category values.
 */
type CommonCategoryValue =
	| 'Languages'
	| 'Frameworks'
	| 'Databases'
	| 'Cloud'
	| 'Tools'
	| 'custom'
	| 'back';

/**
 * Back/cancel option for select menus.
 */
const BACK_CHOICE = { value: 'back' as const, name: '\u2190 Back (cancel)' };

/**
 * Common skill categories for quick selection.
 */
const COMMON_CATEGORIES: ReadonlyArray<{
	value: CommonCategoryValue;
	name: string;
}> = [
	{ value: 'Languages', name: 'Languages (e.g., JavaScript, Python)' },
	{ value: 'Frameworks', name: 'Frameworks (e.g., React, Express)' },
	{ value: 'Databases', name: 'Databases (e.g., PostgreSQL, MongoDB)' },
	{ value: 'Cloud', name: 'Cloud & DevOps (e.g., AWS, Docker)' },
	{ value: 'Tools', name: 'Tools (e.g., Git, VS Code)' },
	{ value: 'custom', name: 'Custom category...' },
];

/**
 * Proficiency levels for skills.
 */
const PROFICIENCY_LEVELS = [
	{ value: 'expert', name: 'Expert' },
	{ value: 'proficient', name: 'Proficient' },
	{ value: 'familiar', name: 'Familiar' },
	{ value: '', name: 'Skip (no level)' },
] as const;

/**
 * Collect skill categories with "add another" loop.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing skill categories to start with
 * @returns Updated array of skill categories
 */
export async function collectSkills(
	mode: WizardMode,
	existing: SkillCategory[],
): Promise<SkillCategory[]> {
	const categories = [...existing];

	// Show existing categories if any
	if (categories.length > 0) {
		console.log(pc.cyan(`\nSkills (${categories.length} categories)`));
		for (const category of categories) {
			const skillNames = category.skills.map((s) => s.name).join(', ');
			console.log(pc.dim(`  ${category.name}: ${skillNames}`));
		}
	} else {
		console.log(pc.cyan('\nSkills'));
	}

	// Prompt to add first category
	const defaultAdd = categories.length === 0;
	let addMore = await confirm({
		message: 'Add a skills category?',
		default: defaultAdd,
	});

	if (!addMore) {
		return categories;
	}

	// Collect first category
	const firstCategory = await collectSingleSkillCategory(mode);
	if (firstCategory) {
		categories.push(firstCategory);
	}

	// Loop for additional categories
	addMore = await confirm({
		message: 'Add another skills category?',
		default: false,
	});

	while (addMore) {
		const category = await collectSingleSkillCategory(mode);
		if (category) {
			categories.push(category);
		}

		addMore = await confirm({
			message: 'Add another skills category?',
			default: false,
		});
	}

	return categories;
}

/**
 * Collect a single skill category.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing skill category for editing (optional)
 * @returns Skill category with name and skills, or null if user cancels
 */
export async function collectSingleSkillCategory(
	mode: WizardMode,
	existing?: SkillCategory,
): Promise<SkillCategory | null> {
	let categoryName: string;

	if (mode === 'quick') {
		// Quick mode: select from common categories with back option
		// Find if existing name matches a known category
		const existingValue = COMMON_CATEGORIES.find(
			(c) => c.value === existing?.name,
		)?.value;
		const selection = await select({
			message: 'Category:',
			choices: [BACK_CHOICE, new Separator(), ...COMMON_CATEGORIES],
			default: existingValue,
		});

		// Handle back/cancel
		if (selection === 'back') {
			return null;
		}

		if (selection === 'custom') {
			categoryName = await input({
				message: 'Custom category name *:',
				default: existing?.name,
				validate: (value) => {
					if (!value.trim()) return 'Category name is required';
					return true;
				},
			});
		} else {
			categoryName = selection;
		}
	} else {
		// Detailed mode: select from common categories with back option, then allow custom
		const existingValue = COMMON_CATEGORIES.find(
			(c) => c.value === existing?.name,
		)?.value;
		const selection = await select({
			message: 'Category:',
			choices: [BACK_CHOICE, new Separator(), ...COMMON_CATEGORIES],
			default: existingValue,
		});

		// Handle back/cancel
		if (selection === 'back') {
			return null;
		}

		if (selection === 'custom') {
			categoryName = await input({
				message: 'Custom category name *:',
				default: existing?.name,
				validate: (value) => {
					if (!value.trim()) return 'Category name is required';
					return true;
				},
			});
		} else {
			categoryName = selection;
		}
	}

	// Collect skills in category
	const skills = await collectSkillsInCategory(mode, existing?.skills);

	return {
		name: categoryName.trim(),
		skills,
	};
}

/**
 * Collect skills within a category.
 * @param mode - Wizard mode (quick or detailed)
 * @param existing - Existing skills for editing (optional)
 * @returns Array of skills
 */
export async function collectSkillsInCategory(
	mode: WizardMode,
	existing?: Skill[],
): Promise<Skill[]> {
	// Get comma-separated skills
	const defaultSkills = existing?.map((s) => s.name).join(', ') ?? '';
	const skillsInput = await input({
		message: 'Skills in this category (comma-separated):',
		default: defaultSkills,
		validate: (value) => {
			if (!value.trim()) return 'At least one skill is required';
			return true;
		},
	});

	// Parse comma-separated input into skill names
	const skillNames = skillsInput
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	// In quick mode, just return skills with names only
	if (mode === 'quick') {
		return skillNames.map((name) => ({ name }));
	}

	// Detailed mode: optionally prompt for proficiency levels
	const addLevels = await confirm({
		message: 'Add proficiency levels?',
		default: false,
	});

	if (!addLevels) {
		return skillNames.map((name) => ({ name }));
	}

	// Collect proficiency level for each skill
	const skills: Skill[] = [];
	for (const name of skillNames) {
		const level = await select({
			message: `${name} proficiency:`,
			choices: PROFICIENCY_LEVELS,
		});

		if (level) {
			skills.push({ name, level });
		} else {
			skills.push({ name });
		}
	}

	return skills;
}
