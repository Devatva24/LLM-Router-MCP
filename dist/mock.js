"use strict";
/**
 * Mock model responses for zero-cost testing.
 * Enable with: MOCK_MODE=true node dist/index.js
 *
 * Each mock returns a realistic-looking response so you can verify:
 *   - Routing logic (right model picked for the task)
 *   - Context cache (compression + session continuity)
 *   - Cursor MCP integration (tool calls, responses)
 *   - Classifier labels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_MODE = void 0;
exports.mockClassify = mockClassify;
exports.mockCallClaude = mockCallClaude;
exports.mockCallGemini = mockCallGemini;
exports.mockCallGPT4o = mockCallGPT4o;
const logger_js_1 = require("./logger.js");
const hasAllKeys = !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.GOOGLE_API_KEY &&
    !!process.env.OPENAI_API_KEY;
exports.MOCK_MODE = process.env.MOCK_MODE === "true" || !hasAllKeys;
if (!hasAllKeys && process.env.MOCK_MODE !== "true") {
    console.error("⚠️  API keys missing — auto-enabling mock mode.");
    console.error("    Set ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENAI_API_KEY for real responses.");
}
// Simulates ~200-400ms network latency so it feels real
function delay(ms = 250) {
    return new Promise((r) => setTimeout(r, ms));
}
// ── Mock responses per task type ────────────────────────────────────────────
const MOCK_RESPONSES = {
    planning: (prompt) => `
[MOCK — Gemini 1.5 Flash | planning]

## Workflow plan for: "${prompt.slice(0, 60)}..."

1. **Define data models** — identify core entities and relationships
2. **Design API surface** — REST endpoints or GraphQL schema
3. **Set up project scaffold** — folder structure, config, env vars
4. **Implement core logic** — services, repositories, business rules
5. **Add auth & middleware** — JWT / session, rate limiting, CORS
6. **Write tests** — unit → integration → e2e
7. **CI/CD pipeline** — lint, test, build, deploy

> Mock response. No Gemini API was called.
`.trim(),
    scaffolding: (prompt) => `
[MOCK — Gemini 1.5 Flash | scaffolding]

Suggested file structure for: "${prompt.slice(0, 50)}..."

\`\`\`
src/
├── controllers/
│   └── index.ts
├── services/
│   └── index.ts
├── models/
│   └── index.ts
├── middleware/
│   └── auth.ts
├── utils/
│   └── logger.ts
└── index.ts
\`\`\`

> Mock response. No Gemini API was called.
`.trim(),
    codegen: (prompt) => `
[MOCK — Claude Sonnet | codegen]

Here's an implementation for: "${prompt.slice(0, 60)}..."

\`\`\`typescript
export function solution(input: unknown): unknown {
  // TODO: replace with real Claude output in production
  // This mock confirms routing → Claude for codegen tasks

  if (!input) throw new Error("Input required");

  const result = Array.isArray(input)
    ? input.map((item) => ({ item, processed: true }))
    : { input, processed: true };

  return result;
}
\`\`\`

> Mock response. No Anthropic API was called.
`.trim(),
    refactor: (prompt) => `
[MOCK — Claude Sonnet | refactor]

Refactoring suggestions for: "${prompt.slice(0, 60)}..."

1. Extract repeated logic into a shared utility function
2. Replace \`any\` types with proper TypeScript interfaces
3. Use \`const\` instead of \`let\` where values aren't reassigned
4. Add early-return guards to reduce nesting depth
5. Break functions > 40 lines into smaller, named helpers

> Mock response. No Anthropic API was called.
`.trim(),
    review: (prompt) => `
[MOCK — Claude Sonnet | review]

Code review for: "${prompt.slice(0, 60)}..."

✅ Strengths
- Clear naming conventions
- Single responsibility on most functions

⚠️ Issues found
- Line 12: potential null reference, add optional chaining
- Line 34: async function missing await, will silently fail
- Missing input validation before database call

💡 Suggestions
- Add JSDoc comments to public functions
- Consider adding a rate limiter middleware

> Mock response. No Anthropic API was called.
`.trim(),
    implementation: (prompt) => `
[MOCK — GPT-4o | implementation]

Implementation for: "${prompt.slice(0, 60)}..."

\`\`\`typescript
import { Request, Response } from "express";

export async function handler(req: Request, res: Response) {
  try {
    // Mock implementation — replace with real GPT-4o output
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id required" });

    const result = { id, status: "ok", timestamp: Date.now() };
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
\`\`\`

> Mock response. No OpenAI API was called.
`.trim(),
    testing: (prompt) => `
[MOCK — GPT-4o | testing]

Test suite for: "${prompt.slice(0, 60)}..."

\`\`\`typescript
import { describe, it, expect, vi } from "vitest";

describe("subject under test", () => {
  it("returns expected output for valid input", () => {
    expect(true).toBe(true); // replace with real assertions
  });

  it("throws on invalid input", () => {
    expect(() => { throw new Error("invalid"); }).toThrow("invalid");
  });

  it("handles async correctly", async () => {
    const result = await Promise.resolve("ok");
    expect(result).toBe("ok");
  });
});
\`\`\`

> Mock response. No OpenAI API was called.
`.trim(),
    general: (prompt) => `
[MOCK — Claude Sonnet | general fallback]

Response for: "${prompt.slice(0, 60)}..."

This is the general-purpose fallback route. In production this would
call Claude with your full prompt. The router couldn't confidently
classify this as a specific task type, so it defaulted to Claude.

Try rephrasing with clearer intent — e.g.
  "Plan...", "Write a function...", "Implement...", "Write tests for..."

> Mock response. No Anthropic API was called.
`.trim(),
};
// ── Mock classifier (no API call) ────────────────────────────────────────────
const KEYWORD_MAP = [
    [/test|spec|jest|vitest|unit test|integration test/i, "testing"],
    [/plan|architect|design|structure|how should i|workflow/i, "planning"],
    [/scaffold|boilerplate|setup|folder|project structure/i, "scaffolding"],
    [/implement a function|algorithm|logic|create a class/i, "codegen"],
    [/refactor|clean up|improve|rewrite|restructure/i, "refactor"],
    [/review|debug|explain|what('s| is) wrong|check this/i, "review"],
    [/implement|add endpoint|build the|create the api/i, "implementation"],
    [/write/i, "codegen"],
];
function mockClassify(prompt) {
    for (const [pattern, label] of KEYWORD_MAP) {
        if (pattern.test(prompt)) {
            (0, logger_js_1.log)(`[MOCK] classified as: ${label}`);
            return label;
        }
    }
    (0, logger_js_1.log)("[MOCK] classified as: general (fallback)");
    return "general";
}
// ── Mock model callers ───────────────────────────────────────────────────────
async function mockCallClaude(prompt) {
    await delay(300);
    const task = mockClassify(prompt);
    const handler = MOCK_RESPONSES[task] ?? MOCK_RESPONSES.general;
    return handler(prompt);
}
async function mockCallGemini(prompt) {
    await delay(200);
    const task = mockClassify(prompt);
    const handler = MOCK_RESPONSES[task] ?? MOCK_RESPONSES.general;
    return handler(prompt);
}
async function mockCallGPT4o(prompt) {
    await delay(250);
    const task = mockClassify(prompt);
    const handler = MOCK_RESPONSES[task] ?? MOCK_RESPONSES.general;
    return handler(prompt);
}
