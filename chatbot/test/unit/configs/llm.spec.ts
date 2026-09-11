import assert from "node:assert/strict";
import test from "node:test";

async function withEnv<T>(
  vars: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("getChatModel always sets a bounded timeout, even when the caller passes no options", async () => {
  await withEnv(
    { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-5-mini", LLM_TIMEOUT_MS: "12345" },
    async () => {
      const { getChatModel } = await import(
        `../../../src/configs/llm.js?case=${Date.now()}-a`
      );
      const model = getChatModel();
      assert.equal((model as unknown as { timeout: number }).timeout, 12345);
    },
  );
});

test("getChatModel honors an explicit timeoutMs override", async () => {
  await withEnv(
    { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-5-mini" },
    async () => {
      const { getChatModel } = await import(
        `../../../src/configs/llm.js?case=${Date.now()}-b`
      );
      const model = getChatModel({ timeoutMs: 5000 });
      assert.equal((model as unknown as { timeout: number }).timeout, 5000);
    },
  );
});

test("getVisionModel always sets a bounded timeout by default", async () => {
  await withEnv(
    {
      OPENAI_API_KEY: "test-key",
      OPENAI_VISION_MODEL: "gpt-4o-mini",
      VISION_TIMEOUT_MS: "54321",
    },
    async () => {
      const { getVisionModel } = await import(
        `../../../src/configs/llm.js?case=${Date.now()}-c`
      );
      const model = getVisionModel();
      assert.equal((model as unknown as { timeout: number }).timeout, 54321);
    },
  );
});
