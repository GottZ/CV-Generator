# Quick Task 009 Summary: Add `bun run cvgen` Script

**Status:** Complete
**Date:** 2026-02-03

## What Changed

Added `cvgen` script to root `package.json`:

```json
"scripts": {
  "cvgen": "bun run packages/cli/src/index.ts",
  ...
}
```

## Verification

```bash
$ bun run cvgen --help
# Shows CLI help ✓

$ bun run cvgen build --help
# Arguments pass through correctly ✓
```

## Files Modified

- `/workspace/package.json` - Added `cvgen` script

## Usage

Now you can run from repo root:

```bash
bun run cvgen --help
bun run cvgen build jane-developer modern
bun run cvgen ai analyze jane-developer
bun run cvgen wizard
```

No more typing `bun run packages/cli/src/index.ts`!
