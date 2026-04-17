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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_MODE = void 0;
exports.mockClassify = mockClassify;
exports.mockCallClaude = mockCallClaude;
exports.mockCallGemini = mockCallGemini;
exports.mockCallGPT4o = mockCallGPT4o;
var logger_js_1 = require("./logger.js");
exports.MOCK_MODE = process.env.MOCK_MODE === "true";
// Simulates ~200-400ms network latency so it feels real
function delay(ms) {
    if (ms === void 0) { ms = 250; }
    return new Promise(function (r) { return setTimeout(r, ms); });
}
// ── Mock responses per task type ────────────────────────────────────────────
var MOCK_RESPONSES = {
    planning: function (prompt) { return "\n[MOCK \u2014 Gemini 1.5 Flash | planning]\n\n## Workflow plan for: \"".concat(prompt.slice(0, 60), "...\"\n\n1. **Define data models** \u2014 identify core entities and relationships\n2. **Design API surface** \u2014 REST endpoints or GraphQL schema\n3. **Set up project scaffold** \u2014 folder structure, config, env vars\n4. **Implement core logic** \u2014 services, repositories, business rules\n5. **Add auth & middleware** \u2014 JWT / session, rate limiting, CORS\n6. **Write tests** \u2014 unit \u2192 integration \u2192 e2e\n7. **CI/CD pipeline** \u2014 lint, test, build, deploy\n\n> Mock response. No Gemini API was called.\n").trim(); },
    scaffolding: function (prompt) { return "\n[MOCK \u2014 Gemini 1.5 Flash | scaffolding]\n\nSuggested file structure for: \"".concat(prompt.slice(0, 50), "...\"\n\n```\nsrc/\n\u251C\u2500\u2500 controllers/\n\u2502   \u2514\u2500\u2500 index.ts\n\u251C\u2500\u2500 services/\n\u2502   \u2514\u2500\u2500 index.ts\n\u251C\u2500\u2500 models/\n\u2502   \u2514\u2500\u2500 index.ts\n\u251C\u2500\u2500 middleware/\n\u2502   \u2514\u2500\u2500 auth.ts\n\u251C\u2500\u2500 utils/\n\u2502   \u2514\u2500\u2500 logger.ts\n\u2514\u2500\u2500 index.ts\n```\n\n> Mock response. No Gemini API was called.\n").trim(); },
    codegen: function (prompt) { return "\n[MOCK \u2014 Claude Sonnet | codegen]\n\nHere's an implementation for: \"".concat(prompt.slice(0, 60), "...\"\n\n```typescript\nexport function solution(input: unknown): unknown {\n  // TODO: replace with real Claude output in production\n  // This mock confirms routing \u2192 Claude for codegen tasks\n\n  if (!input) throw new Error(\"Input required\");\n\n  const result = Array.isArray(input)\n    ? input.map((item) => ({ item, processed: true }))\n    : { input, processed: true };\n\n  return result;\n}\n```\n\n> Mock response. No Anthropic API was called.\n").trim(); },
    refactor: function (prompt) { return "\n[MOCK \u2014 Claude Sonnet | refactor]\n\nRefactoring suggestions for: \"".concat(prompt.slice(0, 60), "...\"\n\n1. Extract repeated logic into a shared utility function\n2. Replace `any` types with proper TypeScript interfaces\n3. Use `const` instead of `let` where values aren't reassigned\n4. Add early-return guards to reduce nesting depth\n5. Break functions > 40 lines into smaller, named helpers\n\n> Mock response. No Anthropic API was called.\n").trim(); },
    review: function (prompt) { return "\n[MOCK \u2014 Claude Sonnet | review]\n\nCode review for: \"".concat(prompt.slice(0, 60), "...\"\n\n\u2705 Strengths\n- Clear naming conventions\n- Single responsibility on most functions\n\n\u26A0\uFE0F Issues found\n- Line 12: potential null reference, add optional chaining\n- Line 34: async function missing await, will silently fail\n- Missing input validation before database call\n\n\uD83D\uDCA1 Suggestions\n- Add JSDoc comments to public functions\n- Consider adding a rate limiter middleware\n\n> Mock response. No Anthropic API was called.\n").trim(); },
    implementation: function (prompt) { return "\n[MOCK \u2014 GPT-4o | implementation]\n\nImplementation for: \"".concat(prompt.slice(0, 60), "...\"\n\n```typescript\nimport { Request, Response } from \"express\";\n\nexport async function handler(req: Request, res: Response) {\n  try {\n    // Mock implementation \u2014 replace with real GPT-4o output\n    const { id } = req.params;\n    if (!id) return res.status(400).json({ error: \"id required\" });\n\n    const result = { id, status: \"ok\", timestamp: Date.now() };\n    return res.status(200).json(result);\n  } catch (err) {\n    return res.status(500).json({ error: \"Internal server error\" });\n  }\n}\n```\n\n> Mock response. No OpenAI API was called.\n").trim(); },
    testing: function (prompt) { return "\n[MOCK \u2014 GPT-4o | testing]\n\nTest suite for: \"".concat(prompt.slice(0, 60), "...\"\n\n```typescript\nimport { describe, it, expect, vi } from \"vitest\";\n\ndescribe(\"subject under test\", () => {\n  it(\"returns expected output for valid input\", () => {\n    expect(true).toBe(true); // replace with real assertions\n  });\n\n  it(\"throws on invalid input\", () => {\n    expect(() => { throw new Error(\"invalid\"); }).toThrow(\"invalid\");\n  });\n\n  it(\"handles async correctly\", async () => {\n    const result = await Promise.resolve(\"ok\");\n    expect(result).toBe(\"ok\");\n  });\n});\n```\n\n> Mock response. No OpenAI API was called.\n").trim(); },
    general: function (prompt) { return "\n[MOCK \u2014 Claude Sonnet | general fallback]\n\nResponse for: \"".concat(prompt.slice(0, 60), "...\"\n\nThis is the general-purpose fallback route. In production this would\ncall Claude with your full prompt. The router couldn't confidently\nclassify this as a specific task type, so it defaulted to Claude.\n\nTry rephrasing with clearer intent \u2014 e.g.\n  \"Plan...\", \"Write a function...\", \"Implement...\", \"Write tests for...\"\n\n> Mock response. No Anthropic API was called.\n").trim(); },
};
// ── Mock classifier (no API call) ────────────────────────────────────────────
var KEYWORD_MAP = [
    [/plan|architect|design|structure|how should i|workflow/i, "planning"],
    [/scaffold|boilerplate|setup|folder|project structure/i, "scaffolding"],
    [/write|implement a function|algorithm|logic|create a class/i, "codegen"],
    [/refactor|clean up|improve|rewrite|restructure/i, "refactor"],
    [/review|debug|explain|what('s| is) wrong|check this/i, "review"],
    [/implement|add endpoint|build the|create the api/i, "implementation"],
    [/test|spec|jest|vitest|unit test|integration test/i, "testing"],
];
function mockClassify(prompt) {
    for (var _i = 0, KEYWORD_MAP_1 = KEYWORD_MAP; _i < KEYWORD_MAP_1.length; _i++) {
        var _a = KEYWORD_MAP_1[_i], pattern = _a[0], label = _a[1];
        if (pattern.test(prompt)) {
            (0, logger_js_1.log)("[MOCK] classified as: ".concat(label));
            return label;
        }
    }
    (0, logger_js_1.log)("[MOCK] classified as: general (fallback)");
    return "general";
}
// ── Mock model callers ───────────────────────────────────────────────────────
function mockCallClaude(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var task, handler;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, delay(300)];
                case 1:
                    _b.sent();
                    task = mockClassify(prompt);
                    handler = (_a = MOCK_RESPONSES[task]) !== null && _a !== void 0 ? _a : MOCK_RESPONSES.general;
                    return [2 /*return*/, handler(prompt)];
            }
        });
    });
}
function mockCallGemini(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var task, handler;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, delay(200)];
                case 1:
                    _b.sent();
                    task = mockClassify(prompt);
                    handler = (_a = MOCK_RESPONSES[task]) !== null && _a !== void 0 ? _a : MOCK_RESPONSES.general;
                    return [2 /*return*/, handler(prompt)];
            }
        });
    });
}
function mockCallGPT4o(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var task, handler;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, delay(250)];
                case 1:
                    _b.sent();
                    task = mockClassify(prompt);
                    handler = (_a = MOCK_RESPONSES[task]) !== null && _a !== void 0 ? _a : MOCK_RESPONSES.general;
                    return [2 /*return*/, handler(prompt)];
            }
        });
    });
}
