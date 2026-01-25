# Phase 14 Context: AI Foundation

**Phase:** 14 - AI Foundation
**Created:** 2026-01-25
**Status:** Ready for research/planning

---

## Summary

Phase 14 establishes the AI provider abstraction layer and prompt export capability. Users can configure multiple LLM providers (OpenAI, Anthropic, Ollama) with a flexible config cascade, and can export prompts for manual LLM use when no API key is available.

---

## Decisions

### 1. Provider Configuration UX

| Decision | Choice |
|----------|--------|
| Default provider selection | **Last-used remembered** — stored in project-level `.cvgen-state.json` |
| Per-command override | **Yes** — `--provider` flag allows per-command provider selection |
| Missing API key handling | **Hard error** — exit with clear error explaining how to set the key |
| Ollama configuration | **Separate fields** — `ai.ollama.endpoint` and `ai.ollama.model` |
| First-run multi-provider | **Prompt to choose** — interactive selection when multiple providers configured |
| Key validation | **Optional** — `cvgen ai validate` command to test configuration |
| Model selection | **Per-provider config with array/string hybrid** — `ai.openai.model` can be string (one model) or array (multiple models for different use-cases) |

**State storage:** `.cvgen-state.json` in project root (not global, not per-person)

### 2. Prompt Export Format & Interaction

| Decision | Choice |
|----------|--------|
| Command structure | **Guided discovery** — `cvgen ai prompt` shows overview; `cvgen ai prompt cv` asks for person and continues from state |
| Output destination | **Stdout (pipeable)** — user can pipe to clipboard or file |
| Data inclusion | **Fully interpolated** — export includes actual CV content, ready to paste |
| Context depth | **Adaptive** — suggests command options and guides decisions based on how invoked |

**Command patterns:**
- `cvgen ai prompt` → overview of available prompts
- `cvgen ai prompt cv [person]` → CV-related prompt, state-aware
- `cvgen ai prompt template` → template-related prompt

### 3. Config Cascade Behavior

| Decision | Choice |
|----------|--------|
| Cascade scope | **Full cascade** — AI config at all levels (template, global, env, frontmatter) |
| Env var support | **Full** — `CVGEN_AI_PROVIDER`, `CVGEN_AI_MODEL`, etc. for all AI settings |
| Error verbosity | **Full cascade dump** — show all values and sources on validation failure |
| Array merge behavior | **Merge/append** — frontmatter arrays merge with global arrays |
| Env var array format | **Comma-separated** — `CVGEN_AI_OPENAI_MODEL=gpt-4o,gpt-4o-mini` |
| Schema migration | **Auto-migrate** — automatically update old config to new schema |

**Env var naming convention:**
- API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (standard)
- Provider: `CVGEN_AI_PROVIDER`
- Models: `CVGEN_AI_OPENAI_MODEL`, `CVGEN_AI_ANTHROPIC_MODEL`
- Ollama: `CVGEN_AI_OLLAMA_ENDPOINT`, `CVGEN_AI_OLLAMA_MODEL`

### 4. No-API-Key Experience

| Decision | Choice |
|----------|--------|
| No-key response | **Interactive choice** — prompt: setup provider or export prompt for manual use |
| Setup instructions | **Comprehensive** — env var + config file + provider dashboard link + pricing note |
| Export mode | **Separate command** — `cvgen ai prompt <stage>` for export; `cvgen ai <stage>` uses API |
| Status access | **Always available** — status and context commands work without API key |
| Config state detection | **Different messaging** — first-timer vs returning user with broken config |
| Ollama offline | **Retry prompt** — "Ollama not responding. Start server and retry, or switch provider?" |
| Export preference | **Session only** — remember choice for current session, reset next time |
| Documentation links | **Both** — direct provider links + fallback to our docs |

---

## Constraints

- Phase 14 scope is **foundation only** — provider abstraction and prompt export
- Multi-stage workflow (AI-03+) is Phase 15
- Content generation commands (AI-06+) are Phase 16
- No AI actually runs in Phase 14 — just configuration and export

---

## Open Questions (for research)

1. Vercel AI SDK patterns for provider abstraction
2. Existing `.cvgenrc` schema to extend
3. Nunjucks integration for prompt templates

---

## Deferred Ideas

None captured during discussion.

---

*Generated: 2026-01-25*
