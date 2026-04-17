#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { classifyTask, TaskType } from "./classifier";
import { ContextCache } from "./context-cache";
import { log } from "./logger";
import {
  MOCK_MODE,
  mockClassify,
  mockCallClaude,
  mockCallGemini,
  mockCallGPT4o,
} from "./mock";

if (MOCK_MODE) {
  log("⚠️  MOCK_MODE=true — no real API calls will be made");
}

// WITH THIS:
const hasKeys =
  !!process.env.ANTHROPIC_API_KEY &&
  !!process.env.GOOGLE_API_KEY &&
  !!process.env.OPENAI_API_KEY;

const autoMock = MOCK_MODE || !hasKeys;

if (!hasKeys && !MOCK_MODE) {
  log("⚠️  One or more API keys missing — falling back to mock mode automatically.");
  log("    Set ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENAI_API_KEY to use real models.");
}

const anthropic = autoMock ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genai     = autoMock ? null : new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const openai    = autoMock ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cache = new ContextCache();

// ── Model callers ────────────────────────────────────────────────────────────

async function callClaude(prompt: string, context: string): Promise<string> {
  if (MOCK_MODE) return mockCallClaude(prompt);
  log("routing → Claude (claude-sonnet-4-5)");
  const msg = await anthropic!.messages.create({
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
  return (msg.content[0] as { text: string }).text;
}

async function callGemini(prompt: string, context: string): Promise<string> {
  if (MOCK_MODE) return mockCallGemini(prompt);
  log("routing → Gemini (gemini-1.5-flash)");
  const model = genai!.getGenerativeModel({ model: "gemini-1.5-flash" });
  const fullPrompt = context
    ? `Previous context:\n${context}\n\n---\n\n${prompt}`
    : prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

async function callGPT4o(prompt: string, context: string): Promise<string> {
  if (MOCK_MODE) return mockCallGPT4o(prompt);
  log("routing → GPT-4o");
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (context) {
    messages.push({ role: "system", content: `Context from previous steps:\n${context}` });
  }
  messages.push({ role: "user", content: prompt });

  const res = await openai!.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    messages,
  });
  return res.choices[0].message.content || "";
}

// ── Router ───────────────────────────────────────────────────────────────────

const MODEL_MAP: Record<TaskType, (p: string, c: string) => Promise<string>> = {
  planning:       callGemini,   // Gemini: great at structured planning
  scaffolding:    callGemini,   // Gemini: fast boilerplate / file layout
  codegen:        callClaude,   // Claude: complex logic & nuanced code
  refactor:       callClaude,   // Claude: deep understanding of existing code
  review:         callClaude,   // Claude: best at critique & explanation
  implementation: callGPT4o,   // GPT-4o: solid, cheap implementation tasks
  testing:        callGPT4o,   // GPT-4o: great at test generation
  general:        callClaude,   // Default fallback
};

async function route(prompt: string, sessionId: string): Promise<string> {
  const taskType = MOCK_MODE ? mockClassify(prompt) : await classifyTask(prompt);
  const context = cache.get(sessionId);
  log(`task="${taskType}" session="${sessionId}"`);

  const handler = MODEL_MAP[taskType];
  const response = await handler(prompt, context);

  // Update compressed context cache
  cache.update(sessionId, prompt, response);
  return `[Routed to: ${taskType.toUpperCase()} handler]\n\n${response}`;
}

// ── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "llm-router", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "route_prompt",
      description:
        "Routes a coding prompt to the best LLM (Claude, Gemini, GPT-4o) based on task type. Automatically classifies the task and selects the cheapest/most capable model.",
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const prompt = (args?.prompt as string) || "";
  const sessionId = (args?.session_id as string) || "default";

  try {
    let result = "";

    if (name === "route_prompt") {
      result = await route(prompt, sessionId);
    } else if (name === "plan_workflow") {
      result = await callGemini(prompt, cache.get(sessionId));
      cache.update(sessionId, prompt, result);
      result = `[Gemini — Workflow Planning]\n\n${result}`;
    } else if (name === "generate_code") {
      result = await callClaude(prompt, cache.get(sessionId));
      cache.update(sessionId, prompt, result);
      result = `[Claude — Code Generation]\n\n${result}`;
    } else if (name === "implement_feature") {
      result = await callGPT4o(prompt, cache.get(sessionId));
      cache.update(sessionId, prompt, result);
      result = `[GPT-4o — Implementation]\n\n${result}`;
    } else if (name === "clear_context") {
      cache.clear(sessionId);
      result = `Context cleared for session: ${sessionId}`;
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: result }] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("LLM Router MCP server running");
}

main().catch(console.error);