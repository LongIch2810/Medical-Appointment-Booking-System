# Chatbot: provider-agnostic LLM configuration

Date: 2026-08-11
Status: Approved

## Problem

`chatbot/src/` instantiates `new ChatGoogleGenerativeAI({ model, apiKey, temperature })` directly in 24 files across `tools/`, `langgraph/`, `agents/`, `qa_sql/`, and `rag/`, each reading `process.env.GOOGLE_API_KEY` and `process.env.GEMINI_MODEL` (or a hardcoded `"gemini-2.5-flash"`/`"gemini-2.5-pro"`) inline. `ocr.tool.ts` additionally reads `process.env.OCR_MODEL` for its vision model. `summary_medical_record.tool.ts` reads a `SUMMARY_MODEL` env var that has never actually been set in `chatbot/.env`, so it silently falls back to a hardcoded default today.

The project intends to move off Gemini soon (likely onto OpenRouter, which re-exposes most major models — Gemini, Claude, GPT, Llama, etc. — through one OpenAI-compatible API) and possibly switch again after that. Hardcoding a Gemini-specific SDK and env var names across 24 call sites means every provider swap requires touching all of them.

## Design

### 1. Central factory: `chatbot/src/configs/llm.ts`

```ts
import { ChatOpenAI } from "@langchain/openai";

export function getChatModel(opts?: { model?: string; temperature?: number }) {
  return new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: opts?.model ?? process.env.LLM_MODEL,
    temperature: opts?.temperature ?? 0,
    configuration: { baseURL: process.env.LLM_BASE_URL },
  });
}

export function getVisionModel(opts?: { temperature?: number }) {
  return new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_VISION_MODEL,
    temperature: opts?.temperature ?? 0,
    configuration: { baseURL: process.env.LLM_BASE_URL },
  });
}
```

`@langchain/openai` is already a dependency (`chatbot/package.json`) — no new package needed. `ChatOpenAI`'s `configuration` option accepts the OpenAI SDK's `ClientOptions`, which includes `baseURL` (verified against the installed `@langchain/openai` type declarations), so pointing it at any OpenAI-compatible endpoint (OpenRouter, OpenAI itself, or others) works without touching call sites again — only `.env` changes.

### 2. Env vars (replace, don't keep alongside, the Gemini-specific ones)

| New | Replaces | Purpose |
| --- | --- | --- |
| `LLM_API_KEY` | `GOOGLE_API_KEY` | Provider API key |
| `LLM_BASE_URL` | (new) | OpenAI-compatible base URL, e.g. `https://openrouter.ai/api/v1` |
| `LLM_MODEL` | `GEMINI_MODEL` | Default reasoning/text model id (provider-specific format, e.g. OpenRouter's `google/gemini-2.5-pro`) |
| `LLM_VISION_MODEL` | `OCR_MODEL` | Vision-capable model, used only by `ocr.tool.ts` |

`SUMMARY_MODEL` (currently dead — never set, always falls back to a hardcoded string) is dropped as a distinct env var; `summary_medical_record.tool.ts` moves to the same pattern as the other three hardcoded-string call sites (see below): pass its specific model id as a `model` override to `getChatModel(...)` if it genuinely needs a different model than the shared default, otherwise just use the shared default like most call sites already effectively do.

`chatbot/.env.example` and `chatbot/.env` are updated to the new names; `GOOGLE_API_KEY`, `GEMINI_MODEL`, `OCR_MODEL`, `SUMMARY_MODEL` are removed.

### 3. Call-site migration (all 24 files)

Replace each `new ChatGoogleGenerativeAI({ model, apiKey, temperature })` with a call to `getChatModel({ temperature })` (or `getVisionModel({ temperature })` for `ocr.tool.ts`), preserving each file's existing `temperature` value exactly (they currently vary: `0`, `0.2`, `0.3` across different files — this is intentional per-tool tuning, not a bug, and must not be flattened to one shared default).

Three files hardcode `"gemini-2.5-flash"` instead of reading `GEMINI_MODEL` (`qa_sql.ts`, `rag.ts`, `medical_consultation.tool.ts`) — these clearly intend a smaller/faster model than the `gemini-2.5-pro` default used elsewhere. They keep that intent by passing an explicit `model` override to `getChatModel(...)`; since the concrete model id is provider-specific (what "flash" maps to changes per provider), that override becomes a second env var per call site only if needed — simplest is to leave a literal string constant in each of those three files (matching today's behavior of a literal Gemini model string, just replacing it with whatever provider-appropriate model id is chosen at implementation time) rather than inventing three more env vars for a distinction that's really "use the fast/cheap variant here."

Files removing their now-unused `import { ChatGoogleGenerativeAI } from "@langchain/google-genai"` in favor of `import { getChatModel } from "../configs/llm.js"` (or relative path per file location).

### 4. Out of scope

- `@langchain/google-genai` and `@langchain/ollama` remain installed dependencies (untouched) — not part of this change; they're simply unused by the new factory.
- No `LLM_PROVIDER`-style branching between multiple SDKs (rejected approach — see prior discussion). If a future provider genuinely isn't OpenAI-compatible, that's a separate design decision at that time.
- No change to `chatbot/src/configs/vectordb.ts` (Qdrant) or any non-LLM configuration.
- No change to embeddings: `chatbot/src/configs/vectordb.ts` uses `OllamaEmbeddings` (`@langchain/ollama`), unrelated to `GOOGLE_API_KEY`/`ChatGoogleGenerativeAI` and untouched by this change.

## Testing

`chatbot/` has no test runner configured (per `AGENTS.md`/`CLAUDE.md`). Verification is manual: after migration, run `npm --prefix chatbot run dev`, exercise a booking/diagnosis/report flow end-to-end, and confirm responses still come back correctly with the new env vars pointed at a real provider endpoint. `npm --prefix chatbot run build` (if a build script exists) or at minimum a TypeScript check should be run to confirm no leftover references to the removed env vars or the old import.
