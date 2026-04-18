#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // ← add this line
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const generative_ai_1 = require("@google/generative-ai");
const openai_1 = __importDefault(require("openai"));
const classifier_1 = require("./classifier");
const context_cache_1 = require("./context-cache");
const logger_1 = require("./logger");
const mock_1 = require("./mock");
if (mock_1.MOCK_MODE) {
    (0, logger_1.log)("⚠️  MOCK_MODE=true — no real API calls will be made");
}
// WITH THIS:
const hasKeys = !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.GOOGLE_API_KEY &&
    !!process.env.OPENAI_API_KEY;
const autoMock = mock_1.MOCK_MODE || !hasKeys;
if (!hasKeys && !mock_1.MOCK_MODE) {
    (0, logger_1.log)("⚠️  One or more API keys missing — falling back to mock mode automatically.");
    (0, logger_1.log)("    Set ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENAI_API_KEY to use real models.");
}
const anthropic = autoMock ? null : new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const genai = autoMock ? null : new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = autoMock ? null : new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const cache = new context_cache_1.ContextCache();
// ── Model callers ────────────────────────────────────────────────────────────
async function callClaude(prompt, context) {
    if (mock_1.MOCK_MODE)
        return (0, mock_1.mockCallClaude)(prompt);
    (0, logger_1.log)("routing → Claude (claude-sonnet-4-5)");
    const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
            {
                role: "user",
                content: context
                    ? `Previous context:\n${context}\n\n---\n\n${prompt}`
                    : prompt,
            },
        ],
    });
    return msg.content[0].text;
}
async function callGemini(prompt, context) {
    if (mock_1.MOCK_MODE)
        return (0, mock_1.mockCallGemini)(prompt);
    (0, logger_1.log)("routing → Gemini (gemini-1.5-flash)");
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = context
        ? `Previous context:\n${context}\n\n---\n\n${prompt}`
        : prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}
async function callGPT4o(prompt, context) {
    if (mock_1.MOCK_MODE)
        return (0, mock_1.mockCallGPT4o)(prompt);
    (0, logger_1.log)("routing → GPT-4o");
    const messages = [];
    if (context) {
        messages.push({ role: "system", content: `Context from previous steps:\n${context}` });
    }
    messages.push({ role: "user", content: prompt });
    const res = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages,
    });
    return res.choices[0].message.content || "";
}
// ── Router ───────────────────────────────────────────────────────────────────
const MODEL_MAP = {
    planning: callGemini, // Gemini: great at structured planning
    scaffolding: callGemini, // Gemini: fast boilerplate / file layout
    codegen: callClaude, // Claude: complex logic & nuanced code
    refactor: callClaude, // Claude: deep understanding of existing code
    review: callClaude, // Claude: best at critique & explanation
    implementation: callGPT4o, // GPT-4o: solid, cheap implementation tasks
    testing: callGPT4o, // GPT-4o: great at test generation
    general: callClaude, // Default fallback
};
async function route(prompt, sessionId) {
    const taskType = mock_1.MOCK_MODE ? (0, mock_1.mockClassify)(prompt) : await (0, classifier_1.classifyTask)(prompt);
    const context = cache.get(sessionId);
    (0, logger_1.log)(`task="${taskType}" session="${sessionId}"`);
    const handler = MODEL_MAP[taskType];
    const response = await handler(prompt, context);
    // Update compressed context cache
    cache.update(sessionId, prompt, response);
    return `[Routed to: ${taskType.toUpperCase()} handler]\n\n${response}`;
}
// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new index_js_1.Server({ name: "llm-router", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "route_prompt",
            description: "Routes a coding prompt to the best LLM (Claude, Gemini, GPT-4o) based on task type. Automatically classifies the task and selects the cheapest/most capable model.",
            inputSchema: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "The user's coding prompt or question",
                    },
                    session_id: {
                        type: "string",
                        description: "Optional session ID for context continuity (default: 'default')",
                    },
                },
                required: ["prompt"],
            },
        },
        {
            name: "plan_workflow",
            description: "Always uses Gemini to plan a high-level workflow or architecture for a feature.",
            inputSchema: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    session_id: { type: "string" },
                },
                required: ["prompt"],
            },
        },
        {
            name: "generate_code",
            description: "Always uses Claude for complex code generation, logic-heavy tasks, or refactoring.",
            inputSchema: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    session_id: { type: "string" },
                },
                required: ["prompt"],
            },
        },
        {
            name: "implement_feature",
            description: "Always uses GPT-4o for feature implementation, test generation, or repetitive coding tasks.",
            inputSchema: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    session_id: { type: "string" },
                },
                required: ["prompt"],
            },
        },
        {
            name: "clear_context",
            description: "Clears the context cache for a session, starting fresh.",
            inputSchema: {
                type: "object",
                properties: {
                    session_id: { type: "string" },
                },
                required: [],
            },
        },
    ],
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = args?.prompt || "";
    const sessionId = args?.session_id || "default";
    try {
        let result = "";
        if (name === "route_prompt") {
            result = await route(prompt, sessionId);
        }
        else if (name === "plan_workflow") {
            result = await callGemini(prompt, cache.get(sessionId));
            cache.update(sessionId, prompt, result);
            result = `[Gemini — Workflow Planning]\n\n${result}`;
        }
        else if (name === "generate_code") {
            result = await callClaude(prompt, cache.get(sessionId));
            cache.update(sessionId, prompt, result);
            result = `[Claude — Code Generation]\n\n${result}`;
        }
        else if (name === "implement_feature") {
            result = await callGPT4o(prompt, cache.get(sessionId));
            cache.update(sessionId, prompt, result);
            result = `[GPT-4o — Implementation]\n\n${result}`;
        }
        else if (name === "clear_context") {
            cache.clear(sessionId);
            result = `Context cleared for session: ${sessionId}`;
        }
        else {
            throw new Error(`Unknown tool: ${name}`);
        }
        return { content: [{ type: "text", text: result }] };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    (0, logger_1.log)("LLM Router MCP server running");
}
main().catch(console.error);
