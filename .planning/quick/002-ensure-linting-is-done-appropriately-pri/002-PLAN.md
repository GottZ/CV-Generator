---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - .git/hooks/pre-commit
autonomous: true

must_haves:
  truths:
    - "Git commits are blocked when lint errors exist"
    - "Clean code commits succeed without interruption"
    - "Lint errors are reported before commit completes"
  artifacts:
    - path: ".git/hooks/pre-commit"
      provides: "Pre-commit hook running Biome lint"
      contains: "biome check"
  key_links:
    - from: ".git/hooks/pre-commit"
      to: "biome check"
      via: "bun run lint"
      pattern: "bun run lint"
---

<objective>
Set up a git pre-commit hook that runs Biome linting before commits are allowed.

Purpose: Ensure code quality by catching lint errors before they enter the repository, maintaining consistent code style across all contributions.
Output: A working pre-commit hook that blocks commits with lint errors.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@/workspace/biome.json
@/workspace/package.json

Technical context:
- Biome 2.3.11 configured at /workspace/biome.json
- `bun run lint` runs `biome check .` (defined in package.json)
- No pre-commit hook exists yet (only .sample files in .git/hooks/)
- Runtime is Bun, not Node.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create pre-commit hook for Biome linting</name>
  <files>.git/hooks/pre-commit</files>
  <action>
Create a git pre-commit hook at `.git/hooks/pre-commit` that:

1. Runs `bun run lint` to check all staged files
2. Exits with code 0 (success) if lint passes
3. Exits with code 1 (failure) if lint fails, blocking the commit
4. Prints helpful message on failure explaining what happened

Hook content:
```bash
#!/bin/sh
# Pre-commit hook: Run Biome linting before commits

echo "Running Biome lint check..."

if bun run lint; then
    echo "Lint passed. Proceeding with commit."
    exit 0
else
    echo ""
    echo "Lint check failed. Please fix the errors above before committing."
    echo "Run 'bun run lint:fix' to auto-fix issues."
    exit 1
fi
```

After creating the file, make it executable with `chmod +x`.

Note: Using `bun run lint` instead of calling biome directly to maintain consistency with package.json scripts.
  </action>
  <verify>
1. `ls -la .git/hooks/pre-commit` shows executable permissions (-rwx)
2. `cat .git/hooks/pre-commit` shows correct content
3. Create a test: introduce a lint error, attempt commit (should fail), then fix and commit (should succeed)
  </verify>
  <done>
Pre-commit hook exists at .git/hooks/pre-commit, is executable, and blocks commits when lint errors are present.
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify hook works with test commit</name>
  <files></files>
  <action>
Verify the pre-commit hook works correctly:

1. First, verify current code is lint-clean: `bun run lint` should pass
2. Create a temporary lint error (e.g., add unused import to a test file)
3. Stage the file with `git add`
4. Attempt `git commit` - should fail with lint error message
5. Revert the test change
6. Verify normal commits work (if there are any pending changes to commit)

If no changes exist to test with, create a small non-breaking change (like adding a comment), test the commit flow, then optionally revert.

This task is about verification - do not leave lint errors in the codebase.
  </action>
  <verify>
1. Confirmed: commit with lint error is blocked
2. Confirmed: commit without lint error succeeds (or would succeed if staged)
3. Codebase is clean (no test artifacts left behind)
  </verify>
  <done>
Pre-commit hook verified to block bad commits and allow good commits.
  </done>
</task>

</tasks>

<verification>
- [ ] `.git/hooks/pre-commit` exists and is executable
- [ ] Hook runs `bun run lint` (uses existing package.json script)
- [ ] Commits with lint errors are blocked
- [ ] Clean commits proceed without issue
- [ ] No test artifacts left in codebase
</verification>

<success_criteria>
- Pre-commit hook installed and working
- Lint errors block commits before they're created
- Developers get clear feedback on what to fix
- Existing workflow unchanged for clean code
</success_criteria>

<output>
After completion, create `.planning/quick/002-ensure-linting-is-done-appropriately-pri/002-SUMMARY.md`
</output>
