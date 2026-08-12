# Chatbot Provider-Agnostic LLM Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 24 direct `new ChatGoogleGenerativeAI(...)` call sites across `chatbot/src/` with a single shared factory backed by `ChatOpenAI` against a configurable OpenAI-compatible endpoint, so future provider swaps are env-only.

**Architecture:** One new file, `chatbot/src/configs/llm.ts`, exports `getChatModel({ model?, profile?, temperature? })` and `getVisionModel({ temperature? })`. Every call site swaps its `new ChatGoogleGenerativeAI({...})` for a call to one of these, preserving its existing per-call `temperature`. Env vars move from `GOOGLE_API_KEY`/`GEMINI_MODEL`/`OCR_MODEL`/`SUMMARY_MODEL` to `LLM_API_KEY`/`LLM_MODEL`/`LLM_FAST_MODEL`/`LLM_VISION_MODEL`/`LLM_BASE_URL`.

**Tech Stack:** `@langchain/openai` (`ChatOpenAI`, already a dependency), TypeScript (`tsc --noEmit` for verification — `chatbot/` has no test runner or build script, per `CLAUDE.md`).

**Verification note (2026-08-11):** Tasks 1-4 compile successfully and all 24 call sites now use the shared factory. Fast-model use cases use `profile: "fast"` backed by `LLM_FAST_MODEL`, avoiding provider-specific hardcoded IDs and preserving env-only provider swaps. The local `.env` was migrated to Google's official OpenAI-compatible endpoint without exposing its key. Live invocation reached the provider but returned `401 Invalid API key`, so Task 5 Step 2 remains open until a valid credential is supplied.

## Global Constraints

- No new npm dependency — `@langchain/openai` is already in `chatbot/package.json`.
- Every file's existing `temperature` value is preserved exactly (varies: `0`, `0.2`, `0.3` across files — this is intentional per-tool tuning).
- `ocr.tool.ts` is the only vision call site — it uses `getVisionModel`, everything else uses `getChatModel`.
- Spec: `docs/superpowers/specs/2026-08-11-chatbot-provider-agnostic-llm-config-design.md`.
- Verification per task: `cd chatbot && npx tsc --noEmit` (no test runner exists in this service).

---

### Task 1: LLM factory

**Files:**
- Create: `chatbot/src/configs/llm.ts`
- Modify: `chatbot/.env.example`

**Interfaces:**
- Produces: `getChatModel(opts?: { model?: string; temperature?: number }): ChatOpenAI` and `getVisionModel(opts?: { temperature?: number }): ChatOpenAI` — every later task imports these.

- [x] **Step 1: Create the factory**

Create `chatbot/src/configs/llm.ts`:

```ts
import { ChatOpenAI } from "@langchain/openai";

export function getChatModel(opts?: {
  model?: string;
  profile?: "default" | "fast";
  temperature?: number;
}) {
  const configuredModel =
    opts?.profile === "fast"
      ? process.env.LLM_FAST_MODEL
      : process.env.LLM_MODEL;

  return new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: opts?.model ?? configuredModel,
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

- [x] **Step 2: Update `chatbot/.env.example`**

Replace the Gemini-specific block:

```
PORT=
GOOGLE_API_KEY=

GEMINI_MODEL=
OCR_MODEL=
```

with:

```
PORT=
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_FAST_MODEL=
LLM_VISION_MODEL=
```

- [x] **Step 3: Verify it compiles**

Run: `cd chatbot && npx tsc --noEmit`
Expected: no errors referencing `src/configs/llm.ts` (pre-existing unrelated errors elsewhere, if any, are out of scope for this task).

- [ ] **Step 4: Commit**

```bash
git add chatbot/src/configs/llm.ts chatbot/.env.example
git commit -m "feat(chatbot): add provider-agnostic LLM factory (getChatModel/getVisionModel)"
```

---

### Task 2: Migrate `langgraph/`, `agents/`, `qa_sql/`, `rag/` (7 files, 8 call sites)

**Files:**
- Modify: `chatbot/src/langgraph/build_health_roadmap.graph.ts:165-169`
- Modify: `chatbot/src/langgraph/create_report.graph.ts:116-120`
- Modify: `chatbot/src/langgraph/diagnosis.graph.ts:13-17,165-169`
- Modify: `chatbot/src/agents/agents.ts:22-26`
- Modify: `chatbot/src/qa_sql/qa_sql.ts:32-36`
- Modify: `chatbot/src/qa_sql/admin_qa_sql.ts:28-32`
- Modify: `chatbot/src/rag/rag.ts:11-15`

**Interfaces:**
- Consumes: `getChatModel` from `../configs/llm.js` (Task 1).

- [x] **Step 1: `build_health_roadmap.graph.ts`**

Replace the import `import { ChatGoogleGenerativeAI } from "@langchain/google-genai";` with `import { getChatModel } from "../configs/llm.js";`, and replace:

```ts
    const llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });
```

with:

```ts
    const llm = getChatModel({ temperature: 0.3 });
```

- [x] **Step 2: `create_report.graph.ts`**

Same import swap. Replace:

```ts
    const llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });
```

with:

```ts
    const llm = getChatModel({ temperature: 0.3 });
```

- [x] **Step 3: `diagnosis.graph.ts` (2 call sites)**

Same import swap. Replace the module-level instantiation:

```ts
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});
```

with:

```ts
const llm = getChatModel({ temperature: 0.3 });
```

And the second, function-scoped instantiation:

```ts
    const llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });
```

with:

```ts
    const llm = getChatModel({ temperature: 0.3 });
```

- [x] **Step 4: `agents/agents.ts`**

Same import swap. Replace:

```ts
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
}).bindTools(tools);
```

with:

```ts
const llm = getChatModel({ temperature: 0.3 }).bindTools(tools);
```

- [x] **Step 5: `qa_sql/qa_sql.ts`**

Same import swap (relative path `../configs/llm.js`). This file hardcodes `"gemini-2.5-flash"` (a smaller/faster model than the `gemini-2.5-pro` default) — keep that intent by passing an explicit `model` override; replace the literal Gemini model id with a placeholder OpenRouter-style id that the implementer fills in for their chosen provider (the spec calls this out as a deliberate per-call override, not a new env var). Replace:

```ts
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
  });
```

with:

```ts
  const llm = getChatModel({ profile: "fast", temperature: 0 });
```

- [x] **Step 6: `qa_sql/admin_qa_sql.ts`**

Same import swap. Replace:

```ts
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});
```

with:

```ts
const llm = getChatModel({ temperature: 0 });
```

- [x] **Step 7: `rag/rag.ts`**

Same import swap, same `"gemini-2.5-flash"` override pattern as Step 5. Replace:

```ts
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
  });
```

with:

```ts
  const llm = getChatModel({ profile: "fast", temperature: 0 });
```

- [x] **Step 8: Verify it compiles**

Run: `cd chatbot && npx tsc --noEmit`
Expected: no errors in any of the 7 modified files.

- [ ] **Step 9: Commit**

```bash
git add chatbot/src/langgraph/build_health_roadmap.graph.ts chatbot/src/langgraph/create_report.graph.ts chatbot/src/langgraph/diagnosis.graph.ts chatbot/src/agents/agents.ts chatbot/src/qa_sql/qa_sql.ts chatbot/src/qa_sql/admin_qa_sql.ts chatbot/src/rag/rag.ts
git commit -m "refactor(chatbot): migrate langgraph/agents/qa_sql/rag to the LLM factory"
```

---

### Task 3: Migrate `tools/` batch A (8 files)

**Files:**
- Modify: `chatbot/src/tools/write_professional_report.tool.ts:59-63`
- Modify: `chatbot/src/tools/write_health_roadmap.tool.ts:99-103`
- Modify: `chatbot/src/tools/time_analyzer.tool.ts:69-73`
- Modify: `chatbot/src/tools/health_plan_generator.tool.ts:93-97`
- Modify: `chatbot/src/tools/specialty_name_analyzer.tool.ts:60-64`
- Modify: `chatbot/src/tools/relative_analyzer.tool.ts:55-59`
- Modify: `chatbot/src/tools/summary_medical_record.tool.ts:14-18`
- Modify: `chatbot/src/tools/health_metric_analyzer.too.ts:139-143`

**Interfaces:**
- Consumes: `getChatModel` from `../configs/llm.js` (Task 1).

- [x] **Step 1: `write_professional_report.tool.ts`**

Replace the `ChatGoogleGenerativeAI` import with `import { getChatModel } from "../configs/llm.js";`. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});
```

with:

```ts
const model = getChatModel({ temperature: 0.3 });
```

- [x] **Step 2: `write_health_roadmap.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});
```

with:

```ts
const model = getChatModel({ temperature: 0.3 });
```

- [x] **Step 3: `time_analyzer.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 4: `health_plan_generator.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 5: `specialty_name_analyzer.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 6: `relative_analyzer.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 7: `summary_medical_record.tool.ts`**

Same import swap. This is the file that read a never-set `SUMMARY_MODEL` env var and always fell back to its hardcoded default — replace with the same explicit-override pattern as `qa_sql.ts`/`rag.ts` (Task 2). Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.SUMMARY_MODEL || "gemini-2.5-flash",
  temperature: 0.2,
});
```

with:

```ts
const model = getChatModel({ profile: "fast", temperature: 0.2 });
```

- [x] **Step 8: `health_metric_analyzer.too.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 9: Verify it compiles**

Run: `cd chatbot && npx tsc --noEmit`
Expected: no errors in any of the 8 modified files.

- [ ] **Step 10: Commit**

```bash
git add chatbot/src/tools/write_professional_report.tool.ts chatbot/src/tools/write_health_roadmap.tool.ts chatbot/src/tools/time_analyzer.tool.ts chatbot/src/tools/health_plan_generator.tool.ts chatbot/src/tools/specialty_name_analyzer.tool.ts chatbot/src/tools/relative_analyzer.tool.ts chatbot/src/tools/summary_medical_record.tool.ts "chatbot/src/tools/health_metric_analyzer.too.ts"
git commit -m "refactor(chatbot): migrate tools batch A to the LLM factory"
```

---

### Task 4: Migrate `tools/` batch B (9 files, including vision)

**Files:**
- Modify: `chatbot/src/tools/health_metric_progress.tool.ts:71-75`
- Modify: `chatbot/src/tools/doctor_name_analyzer.tool.ts:28-32`
- Modify: `chatbot/src/tools/symptoms_analyzer.tool.ts:36-40`
- Modify: `chatbot/src/tools/clinical_suggestion.tool.ts:46-50`
- Modify: `chatbot/src/tools/diagnosis.tool.ts:38-42`
- Modify: `chatbot/src/tools/generate_chat_config.tool.ts:115-119`
- Modify: `chatbot/src/tools/medical_consultation.tool.ts:9-13`
- Modify: `chatbot/src/tools/ocr.tool.ts:211-215`

**Interfaces:**
- Consumes: `getChatModel`, `getVisionModel` from `../configs/llm.js` (Task 1).

- [x] **Step 1: `health_metric_progress.tool.ts`**

Replace the `ChatGoogleGenerativeAI` import with `import { getChatModel } from "../configs/llm.js";`. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 2: `doctor_name_analyzer.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 3: `symptoms_analyzer.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 4: `clinical_suggestion.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 5: `diagnosis.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 6: `generate_chat_config.tool.ts`**

Same import swap. Replace:

```ts
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const model = getChatModel({ temperature: 0 });
```

- [x] **Step 7: `medical_consultation.tool.ts`**

Same import swap, same explicit-override pattern (this file also hardcodes `"gemini-2.5-flash"`). Replace:

```ts
const medicalLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});
```

with:

```ts
const medicalLLM = getChatModel({ profile: "fast", temperature: 0.3 });
```

- [x] **Step 8: `ocr.tool.ts` — vision model**

Replace the `ChatGoogleGenerativeAI` import with `import { getVisionModel } from "../configs/llm.js";`. Replace:

```ts
const visionLLM = new ChatGoogleGenerativeAI({
  model: process.env.OCR_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
```

with:

```ts
const visionLLM = getVisionModel({ temperature: 0 });
```

- [x] **Step 9: Verify it compiles**

Run: `cd chatbot && npx tsc --noEmit`
Expected: no errors in any of the 8 modified files, and — since this is the last batch — zero remaining references to `ChatGoogleGenerativeAI`, `GOOGLE_API_KEY`, `GEMINI_MODEL`, `OCR_MODEL`, or `SUMMARY_MODEL` anywhere in `chatbot/src`. Confirm with:

Run: `grep -rn "ChatGoogleGenerativeAI\|GOOGLE_API_KEY\|GEMINI_MODEL\|OCR_MODEL\|SUMMARY_MODEL" chatbot/src`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add chatbot/src/tools/health_metric_progress.tool.ts chatbot/src/tools/doctor_name_analyzer.tool.ts chatbot/src/tools/symptoms_analyzer.tool.ts chatbot/src/tools/clinical_suggestion.tool.ts chatbot/src/tools/diagnosis.tool.ts chatbot/src/tools/generate_chat_config.tool.ts chatbot/src/tools/medical_consultation.tool.ts chatbot/src/tools/ocr.tool.ts
git commit -m "refactor(chatbot): migrate tools batch B (incl. OCR vision model) to the LLM factory"
```

---

### Task 5: Update `.env` and manually verify a real flow

**Files:** `chatbot/.env` (not committed — gitignored)

- [x] **Step 1: Update the local `.env`**

Edit `chatbot/.env`: remove `GOOGLE_API_KEY`, `GEMINI_MODEL`, `OCR_MODEL`; add `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_FAST_MODEL`, `LLM_VISION_MODEL` with real values for the OpenAI-compatible provider in use.

- [ ] **Step 2: Manually exercise a real flow**

Run: `npm --prefix chatbot run dev`
Then send a request through one full conversational flow (e.g. the booking or diagnosis graph via whatever route/client is normally used to reach it — see `chatbot/src/routes/`) and confirm a real response comes back with no thrown errors in the terminal.

- [ ] **Step 3: Commit (plan/doc only — `.env` itself is gitignored, nothing to add there)**

Nothing to commit for this task; it's a manual verification checkpoint. If Steps 1-2 surfaced a bug in Tasks 1-4, fix it in the relevant task's files and commit that fix separately.
