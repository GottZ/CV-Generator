---
phase: 14
plan: 03
subsystem: ai
tags: [cli-commands, prompt-export, provider-validation, configuration-display]
dependency-graph:
  requires: [14-01, 14-02]
  provides: [ai-cli-commands, prompt-export, provider-validation]
  affects: [15-xx, 16-xx, 17-xx]
tech-stack:
  added: []
  patterns: [commander-subcommands, cli-progressive-disclosure]
key-files:
  created:
    - packages/cli/src/commands/ai.ts
    - packages/cli/src/commands/ai/config.ts
    - packages/cli/src/commands/ai/validate.ts
    - packages/cli/src/commands/ai/prompt.ts
  modified:
    - packages/cli/src/index.ts
    - packages/cli/src/ai/index.ts
decisions:
  - id: command-group-pattern
    choice: "Use commander subcommand groups for ai commands"
    rationale: "Clean namespace, consistent with existing CLI structure"
  - id: prompt-export-first
    choice: "Prompt export works without API key"
    rationale: "AI-02 requirement - users can export prompts for manual LLM use"
metrics:
  duration: 6min
  completed: 2026-01-25
---

# Phase 14 Plan 03: AI CLI Commands Summary

User-facing CLI commands for AI configuration, validation, and prompt export.

## What Was Built

### cvgen ai command group
- Parent command for all AI-related subcommands
- Help text with usage examples
- Three subcommands: prompt, config, validate

### cvgen ai config
- Display current AI configuration with sources
- Show available providers (based on configured API keys)
- Per-provider status: API key configured, model in use
- Setup hints when no providers configured
- Supports --json and --quiet flags

### cvgen ai validate
- Test provider connectivity and API key validity
- Validate all configured providers by default
- --provider flag to validate specific provider
- Spinner feedback during validation
- Exit code 1 if any validation fails
- Supports --json and --quiet flags

### cvgen ai prompt
- List available prompts when no name provided
- Export rendered prompt to stdout (pipeable)
- Load CV data from people directory
- Support --job flag for tailor prompt
- Works WITHOUT API key configured (AI-02 requirement)
- Supports --json and --quiet flags

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/commands/ai.ts` | AI command group with subcommands |
| `packages/cli/src/commands/ai/config.ts` | Configuration display subcommand |
| `packages/cli/src/commands/ai/validate.ts` | Provider validation subcommand |
| `packages/cli/src/commands/ai/prompt.ts` | Prompt export subcommand |
| `packages/cli/src/index.ts` | Main CLI with ai command registered |
| `packages/cli/src/ai/index.ts` | Public AI module exports |

## Commits

| Hash | Description |
|------|-------------|
| 2254861 | feat(14-03): create AI config subcommand |
| 2fd8f46 | feat(14-03): create AI validate subcommand |
| 55566fd | feat(14-03): create AI prompt subcommand |
| a6f72f2 | feat(14-03): create AI command group |
| 047a0c7 | feat(14-03): integrate AI command into main CLI |
| afa992d | feat(14-03): update AI module exports for prompt system |
| 055b2e0 | fix(14-03): fix lint and type issues in docx-linebreaks test |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing lint issues in docx-linebreaks test**
- **Found during:** Task 1 commit attempt
- **Issue:** Pre-existing non-null assertions in test file blocked all commits
- **Fix:** Replaced `runs[0]!` with proper type guards using throw statements
- **Files modified:** packages/cli/src/lib/__tests__/docx-linebreaks.test.ts
- **Commit:** 055b2e0

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| command-group-pattern | Commander subcommand groups | Clean namespace, matches existing CLI patterns |
| prompt-export-first | Prompt works without API key | Core AI-02 requirement for manual LLM workflow |

## Usage Examples

```bash
# List available prompts
cvgen ai prompt

# Export analyze prompt for a person
cvgen ai prompt analyze --person johndoe

# Export tailor prompt with job description
cvgen ai prompt tailor --person johndoe --job posting.txt

# Pipe to clipboard
cvgen ai prompt analyze --person johndoe | pbcopy

# View current AI configuration
cvgen ai config
cvgen ai config --json

# Validate configured providers
cvgen ai validate
cvgen ai validate --provider openai
```

## Verification Results

1. `bun run typecheck` - passes
2. `cvgen ai --help` - shows prompt, config, validate subcommands
3. `cvgen ai prompt` - lists analyze, improve, summarize, tailor
4. `cvgen ai config` - shows configuration with sources
5. `cvgen ai validate` - tests provider connectivity
6. `cvgen ai prompt analyze --person testuser` - outputs rendered prompt
7. Prompt export works without API key configured

## Next Phase Readiness

**Phase 14 Complete:** All three plans delivered:
- 14-01: AI infrastructure foundation
- 14-02: Prompt template system
- 14-03: CLI commands

**Prerequisites for Phase 15 (Multi-Stage Workflow):**
- AI provider abstraction ready (from 14-01)
- Prompt templates ready (from 14-02)
- CLI command patterns established (from 14-03)
- Can now build `cvgen ai bullets`, `cvgen ai summarize`, etc.
