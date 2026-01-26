/**
 * Tests for flag collector in non-interactive wizard mode.
 */

import { describe, expect, it } from 'bun:test';
import {
	type AddCertificationFlagOptions,
	type AddEducationFlagOptions,
	type AddExperienceFlagOptions,
	type AddProjectFlagOptions,
	type AddSkillsFlagOptions,
	buildCertificationFromFlags,
	buildContactFromFlags,
	buildEducationFromFlags,
	buildExperienceFromFlags,
	buildProjectFromFlags,
	buildSkillsFromFlags,
	type InitFlagOptions,
} from '../flag-collector.ts';

describe('flag-collector', () => {
	describe('buildContactFromFlags', () => {
		it('returns empty object when no name provided', () => {
			const result = buildContactFromFlags({});
			expect(result).toEqual({});
		});

		it('builds contact with name only', () => {
			const result = buildContactFromFlags({ name: 'Jane Doe' });
			expect(result.contact).toEqual({ name: 'Jane Doe' });
		});

		it('builds contact with all fields', () => {
			const flags: InitFlagOptions = {
				name: 'Jane Doe',
				email: 'jane@example.com',
				phone: '+1-555-0100',
				location: 'San Francisco, CA',
				linkedIn: 'linkedin.com/in/janedoe',
				github: 'github.com/janedoe',
				website: 'https://janedoe.dev',
			};

			const result = buildContactFromFlags(flags);

			expect(result.contact?.name).toBe('Jane Doe');
			expect(result.contact?.email).toBe('jane@example.com');
			expect(result.contact?.phone).toBe('+1-555-0100');
			expect(result.contact?.location).toBe('San Francisco, CA');
			expect(result.contact?.links).toHaveLength(3);
		});

		it('normalizes URLs without protocol', () => {
			const result = buildContactFromFlags({
				name: 'Jane',
				linkedIn: 'linkedin.com/in/jane',
			});

			expect(result.contact?.links?.[0]?.url).toBe(
				'https://linkedin.com/in/jane',
			);
		});

		it('preserves existing protocol', () => {
			const result = buildContactFromFlags({
				name: 'Jane',
				website: 'http://localhost:3000',
			});

			expect(result.contact?.links?.[0]?.url).toBe('http://localhost:3000');
		});
	});

	describe('buildExperienceFromFlags', () => {
		it('returns null when required fields missing', () => {
			expect(buildExperienceFromFlags({})).toBeNull();
			expect(buildExperienceFromFlags({ company: 'Acme' })).toBeNull();
			expect(
				buildExperienceFromFlags({ company: 'Acme', role: 'Dev' }),
			).toBeNull();
		});

		it('builds experience with required fields', () => {
			const flags: AddExperienceFlagOptions = {
				company: 'Acme Corp',
				role: 'Senior Developer',
				startDate: '2020-01',
			};

			const result = buildExperienceFromFlags(flags);

			expect(result?.company).toBe('Acme Corp');
			expect(result?.role).toBe('Senior Developer');
			expect(result?.startDate).toBe('2020-01');
			expect(result?.endDate).toBe('present');
			expect(result?.bullets).toEqual([]);
		});

		it('builds experience with all fields', () => {
			const flags: AddExperienceFlagOptions = {
				company: 'Acme Corp',
				role: 'Senior Developer',
				startDate: '2020-01',
				endDate: '2023-06',
				location: 'Remote',
				bullets: ['Built APIs', 'Led team'],
				techStack: 'TypeScript, Node.js, PostgreSQL',
			};

			const result = buildExperienceFromFlags(flags);

			expect(result?.endDate).toBe('2023-06');
			expect(result?.location).toBe('Remote');
			expect(result?.bullets).toEqual(['Built APIs', 'Led team']);
			expect(result?.techStack).toEqual([
				'TypeScript',
				'Node.js',
				'PostgreSQL',
			]);
		});
	});

	describe('buildEducationFromFlags', () => {
		it('returns null when required fields missing', () => {
			expect(buildEducationFromFlags({})).toBeNull();
			expect(
				buildEducationFromFlags({ institution: 'MIT', degree: 'BS' }),
			).toBeNull();
		});

		it('builds education with required fields', () => {
			const flags: AddEducationFlagOptions = {
				institution: 'MIT',
				degree: 'Bachelor of Science',
				startDate: '2016-09',
				endDate: '2020-05',
			};

			const result = buildEducationFromFlags(flags);

			expect(result?.institution).toBe('MIT');
			expect(result?.degree).toBe('Bachelor of Science');
			expect(result?.startDate).toBe('2016-09');
			expect(result?.endDate).toBe('2020-05');
		});

		it('builds education with all optional fields', () => {
			const flags: AddEducationFlagOptions = {
				institution: 'MIT',
				degree: 'Bachelor of Science',
				field: 'Computer Science',
				startDate: '2016-09',
				endDate: '2020-05',
				location: 'Cambridge, MA',
				honors: 'Magna Cum Laude',
				notes: "Dean's List",
			};

			const result = buildEducationFromFlags(flags);

			expect(result?.field).toBe('Computer Science');
			expect(result?.location).toBe('Cambridge, MA');
			expect(result?.honors).toBe('Magna Cum Laude');
			expect(result?.notes).toBe("Dean's List");
		});
	});

	describe('buildSkillsFromFlags', () => {
		it('returns null when required fields missing', () => {
			expect(buildSkillsFromFlags({})).toBeNull();
			expect(buildSkillsFromFlags({ category: 'Languages' })).toBeNull();
		});

		it('builds skills category with names only', () => {
			const flags: AddSkillsFlagOptions = {
				category: 'Languages',
				skills: 'TypeScript, Python, Go',
			};

			const result = buildSkillsFromFlags(flags);

			expect(result?.name).toBe('Languages');
			expect(result?.skills).toHaveLength(3);
			expect(result?.skills[0]).toEqual({ name: 'TypeScript' });
			expect(result?.skills[1]).toEqual({ name: 'Python' });
		});

		it('builds skills with levels', () => {
			const flags: AddSkillsFlagOptions = {
				category: 'Languages',
				skills: 'TypeScript, Python',
				levels: 'Expert, Intermediate',
			};

			const result = buildSkillsFromFlags(flags);

			expect(result?.skills[0]).toEqual({
				name: 'TypeScript',
				level: 'Expert',
			});
			expect(result?.skills[1]).toEqual({
				name: 'Python',
				level: 'Intermediate',
			});
		});
	});

	describe('buildProjectFromFlags', () => {
		it('returns null when name missing', () => {
			expect(buildProjectFromFlags({})).toBeNull();
		});

		it('builds project with name only', () => {
			const result = buildProjectFromFlags({ name: 'My Project' });
			expect(result?.name).toBe('My Project');
		});

		it('builds project with all fields', () => {
			const flags: AddProjectFlagOptions = {
				name: 'CV Generator',
				description: 'CLI tool for generating CVs',
				techStack: 'TypeScript, Bun, Puppeteer',
				url: 'github.com/user/cv-generator',
				urlType: 'github',
				outcome: '1000+ downloads',
				role: 'Creator',
				type: 'open-source',
				startDate: '2024-01',
				endDate: 'present',
				highlight: true,
			};

			const result = buildProjectFromFlags(flags);

			expect(result?.name).toBe('CV Generator');
			expect(result?.description).toBe('CLI tool for generating CVs');
			expect(result?.techStack).toEqual(['TypeScript', 'Bun', 'Puppeteer']);
			expect(result?.links?.[0]?.url).toBe(
				'https://github.com/user/cv-generator',
			);
			expect(result?.links?.[0]?.type).toBe('github');
			expect(result?.outcome).toBe('1000+ downloads');
			expect(result?.role).toBe('Creator');
			expect(result?.type).toBe('open-source');
			expect(result?.highlight).toBe(true);
		});
	});

	describe('buildCertificationFromFlags', () => {
		it('returns null when required fields missing', () => {
			expect(buildCertificationFromFlags({})).toBeNull();
			expect(
				buildCertificationFromFlags({ name: 'AWS SAA', issuer: 'AWS' }),
			).toBeNull();
		});

		it('builds certification with required fields', () => {
			const flags: AddCertificationFlagOptions = {
				name: 'AWS Solutions Architect',
				issuer: 'Amazon Web Services',
				date: '2024-01',
			};

			const result = buildCertificationFromFlags(flags);

			expect(result?.name).toBe('AWS Solutions Architect');
			expect(result?.issuer).toBe('Amazon Web Services');
			expect(result?.date).toBe('2024-01');
		});

		it('builds certification with all fields', () => {
			const flags: AddCertificationFlagOptions = {
				name: 'AWS Solutions Architect',
				issuer: 'Amazon Web Services',
				date: '2024-01',
				expiryDate: '2027-01',
				verificationUrl: 'aws.amazon.com/verify/12345',
				credentialId: 'AWS-SAA-12345',
			};

			const result = buildCertificationFromFlags(flags);

			expect(result?.expiryDate).toBe('2027-01');
			expect(result?.verificationUrl).toBe(
				'https://aws.amazon.com/verify/12345',
			);
			expect(result?.credentialId).toBe('AWS-SAA-12345');
		});
	});
});
