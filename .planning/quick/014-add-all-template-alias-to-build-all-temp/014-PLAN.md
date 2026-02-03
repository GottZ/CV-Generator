---
task: 014
type: quick
description: Add "all" template alias to build command for generating CVs with all templates at once
files_modified:
  - packages/cli/src/commands/build.ts
  - packages/cli/src/index.ts
estimated_effort: 20min
---

<objective>
Add a template alias "all" that generates CVs for all available templates in a single command.

**Before:** User must run separate commands:
```bash
cvgen build janetzky modern
cvgen build janetzky minimal
cvgen build janetzky classic
```

**After:** User can run one command:
```bash
cvgen build janetzky all
```

Purpose: Reduce friction when generating CVs for comparison across all templates.
Output: Modified build command that iterates through all discovered templates when "all" is specified.
</objective>

<context>
@packages/cli/src/commands/build.ts - Current build action, uses discoverTemplates from cv-templates
@packages/cli/src/index.ts - CLI definition with build command help text
@packages/templates/src/engine/loader.ts - discoverTemplates function already filters private templates
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add "all" template handling to buildAction</name>
  <files>packages/cli/src/commands/build.ts</files>
  <action>
Modify the buildAction function to handle template="all":

1. After the "auto" template resolution block (lines 67-86), add handling for "all":
   - If template === 'all', discover all templates and iterate through each
   - For each template, call runBuild with that template ID
   - Accumulate results across all templates
   - Report combined success at the end

2. The logic should be:
```typescript
if (template === 'all') {
  const templates = await discoverTemplates(templatesDir);
  if (templates.length === 0) {
    cons.error('No templates found');
    process.exit(EXIT_TEMPLATE_ERROR);
  }
  cons.info(`Building with all templates: ${templates.map((t) => t.id).join(', ')}`);

  // Build for each template
  for (const tmpl of templates) {
    try {
      cons.info(`\nBuilding with template: ${tmpl.id}`);
      await runBuild(name, tmpl.id, options, cons, personDir, templatesDir, peopleDir, cwd);
    } catch (err) {
      cons.error(`Failed with template ${tmpl.id}: ${(err as Error).message}`);
      // Continue with other templates instead of failing fast
    }
  }
  return;
}
```

3. This block should go after the auto-select logic but before watch mode, so the flow is:
   - Check for "auto" -> resolve to single template
   - Check for "all" -> iterate through all templates
   - Otherwise -> use specified template

4. For watch mode with "all": Disable watch mode (it doesn't make sense to watch all templates). Add error:
```typescript
if (options.watch && template === 'all') {
  cons.error('Watch mode not supported with "all" templates. Specify a single template.');
  process.exit(1);
}
```
  </action>
  <verify>
Run: `bun run cvgen build janetzky all --dry-run` should show output files for all templates (base, classic, minimal, modern).
  </verify>
  <done>
"all" template alias builds CVs using every discovered template in sequence.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update CLI help text and examples</name>
  <files>packages/cli/src/index.ts</files>
  <action>
Update the build command definition:

1. Change the template argument description from:
   `'Template ID to use (e.g., base, or "auto")'`
   to:
   `'Template ID to use (e.g., base, "auto" for single, or "all" for all templates)'`

2. Add an example to the addHelpText block showing the "all" usage:
   `  $ cvgen build johndoe all                # Build with all available templates`
  </action>
  <verify>
Run: `bun run cvgen build --help` should show updated argument description and new example.
  </verify>
  <done>
CLI help clearly documents the "all" template alias option.
  </done>
</task>

</tasks>

<verification>
1. `bun run cvgen build janetzky all --dry-run` shows files for all 4 templates
2. `bun run cvgen build janetzky all --watch` produces helpful error message
3. `bun run cvgen build --help` shows "all" in description and examples
4. `bun check` passes with no type errors
</verification>

<success_criteria>
- Users can run `cvgen build <name> all` to generate CVs with all templates
- Dry-run mode works correctly with "all"
- Watch mode is gracefully rejected with "all"
- Help text documents the new feature
- Existing "auto" and specific template behavior unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/014-add-all-template-alias-to-build-all-temp/014-SUMMARY.md`
</output>
