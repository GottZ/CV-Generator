# Quick Task 010: Extend README for `bun run cvgen`

**Mode:** quick
**Description:** Document the `bun run cvgen` convenience script in README

## Analysis

The README has:
- Quick Start section showing global install usage
- Development section with test instructions

Need to add developer convenience script documentation to Development section.

## Task

### Task 1: Add development usage section to README

**File:** `/workspace/README.md`

**Change:** Add a "Running the CLI" subsection in Development, before "Running Tests":

```markdown
### Running the CLI

When developing locally, use the convenience script instead of the full path:

```bash
# Instead of: bun run packages/cli/src/index.ts build jane modern
bun run cvgen build jane modern

# All commands work the same
bun run cvgen --help
bun run cvgen init john-doe
bun run cvgen ai analyze jane
```
```

**Location:** After "## Development" header, before "### Running Tests"

## Success Criteria

- [ ] README documents `bun run cvgen` usage
- [ ] Placed in Development section (for contributors, not end users)
