# Quick Task 009: Add `bun run cvgen` Script

**Mode:** quick
**Description:** Add root-level script so `bun run cvgen` works instead of manually specifying the TS file

## Analysis

The CLI package (`packages/cli/package.json`) already has:
```json
"bin": {
  "cvgen": "./src/index.ts"
}
```

The root `package.json` has scripts for lint, format, typecheck, test but no `cvgen` script.

## Task

### Task 1: Add cvgen script to root package.json

**File:** `/workspace/package.json`

**Change:** Add a `cvgen` script that runs the CLI entry point:

```json
"scripts": {
  "cvgen": "bun run packages/cli/src/index.ts",
  ...existing scripts...
}
```

This allows:
- `bun run cvgen` from root
- `bun run cvgen build ./people/jane` (with args)
- No need to remember the full path

**Verification:**
```bash
bun run cvgen --help
```

Should display CLI help output.

## Success Criteria

- [ ] `bun run cvgen --help` works from repo root
- [ ] Arguments pass through correctly (e.g., `bun run cvgen build`)
