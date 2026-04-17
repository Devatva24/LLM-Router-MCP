#!/usr/bin/env node
"use strict";
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
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var sdk_1 = require("@anthropic-ai/sdk");
var generative_ai_1 = require("@google/generative-ai");
var openai_1 = require("openai");
var classifier_js_1 = require("./classifier.js");
var context_cache_js_1 = require("./context-cache.js");
var logger_js_1 = require("./logger.js");
var mock_js_1 = require("./mock.js");
if (mock_js_1.MOCK_MODE) {
    (0, logger_js_1.log)("⚠️  MOCK_MODE=true — no real API calls will be made");
}
var anthropic = mock_js_1.MOCK_MODE ? null : new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
var genai = mock_js_1.MOCK_MODE ? null : new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var openai = mock_js_1.MOCK_MODE ? null : new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
var cache = new context_cache_js_1.ContextCache();
// ── Model callers ────────────────────────────────────────────────────────────
function callClaude(prompt, context) {
    return __awaiter(this, void 0, void 0, function () {
        var msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mock_js_1.MOCK_MODE)
                        return [2 /*return*/, (0, mock_js_1.mockCallClaude)(prompt)];
                    (0, logger_js_1.log)("routing → Claude (claude-sonnet-4-5)");
                    return [4 /*yield*/, anthropic.messages.create({
                            model: "claude-sonnet-4-5",
                            max_tokens: 4096,
                            messages: [
                                {
                                    role: "user",
                                    content: context
                                        ? "Previous context:\n".concat(context, "\n\n---\n\n").concat(prompt)
                                        : prompt,
                                },
                            ],
                        })];
                case 1:
                    msg = _a.sent();
                    return [2 /*return*/, msg.content[0].text];
            }
        });
    });
}
function callGemini(prompt, context) {
    return __awaiter(this, void 0, void 0, function () {
        var model, fullPrompt, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mock_js_1.MOCK_MODE)
                        return [2 /*return*/, (0, mock_js_1.mockCallGemini)(prompt)];
                    (0, logger_js_1.log)("routing → Gemini (gemini-1.5-flash)");
                    model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
                    fullPrompt = context
                        ? "Previous context:\n".concat(context, "\n\n---\n\n").concat(prompt)
                        : prompt;
                    return [4 /*yield*/, model.generateContent(fullPrompt)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.response.text()];
            }
        });
    });
}
function callGPT4o(prompt, context) {
    return __awaiter(this, void 0, void 0, function () {
        var messages, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mock_js_1.MOCK_MODE)
                        return [2 /*return*/, (0, mock_js_1.mockCallGPT4o)(prompt)];
                    (0, logger_js_1.log)("routing → GPT-4o");
                    messages = [];
                    if (context) {
                        messages.push({ role: "system", content: "Context from previous steps:\n".concat(context) });
                    }
                    messages.push({ role: "user", content: prompt });
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: "gpt-4o",
                            max_tokens: 4096,
                            messages: messages,
                        })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.choices[0].message.content || ""];
            }
        });
    });
}
// ── Router ───────────────────────────────────────────────────────────────────
var MODEL_MAP = {
    planning: callGemini, // Gemini: great at structured planning
    scaffolding: callGemini, // Gemini: fast boilerplate / file layout
    codegen: callClaude, // Claude: complex logic & nuanced code
    refactor: callClaude, // Claude: deep understanding of existing code
    review: callClaude, // Claude: best at critique & explanation
    implementation: callGPT4o, // GPT-4o: solid, cheap implementation tasks
    testing: callGPT4o, // GPT-4o: great at test generation
    general: callClaude, // Default fallback
};
function route(prompt, sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var taskType, _a, context, handler, response;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!mock_js_1.MOCK_MODE) return [3 /*break*/, 1];
                    _a = (0, mock_js_1.mockClassify)(prompt);
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, (0, classifier_js_1.classifyTask)(prompt)];
                case 2:
                    _a = _b.sent();
                    _b.label = 3;
                case 3:
                    taskType = _a;
                    context = cache.get(sessionId);
                    (0, logger_js_1.log)("task=\"".concat(taskType, "\" session=\"").concat(sessionId, "\""));
                    handler = MODEL_MAP[taskType];
                    return [4 /*yield*/, handler(prompt, context)];
                case 4:
                    response = _b.sent();
                    // Update compressed context cache
                    cache.update(sessionId, prompt, response);
                    return [2 /*return*/, "[Routed to: ".concat(taskType.toUpperCase(), " handler]\n\n").concat(response)];
            }
        });
    });
}
// ── MCP Server ───────────────────────────────────────────────────────────────
var server = new index_js_1.Server({ name: "llm-router", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
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
            })];
    });
}); });
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, args, prompt, sessionId, result, err_1, msg;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.params, name = _a.name, args = _a.arguments;
                prompt = (args === null || args === void 0 ? void 0 : args.prompt) || "";
                sessionId = (args === null || args === void 0 ? void 0 : args.session_id) || "default";
                _b.label = 1;
            case 1:
                _b.trys.push([1, 11, , 12]);
                result = "";
                if (!(name === "route_prompt")) return [3 /*break*/, 3];
                return [4 /*yield*/, route(prompt, sessionId)];
            case 2:
                result = _b.sent();
                return [3 /*break*/, 10];
            case 3:
                if (!(name === "plan_workflow")) return [3 /*break*/, 5];
                return [4 /*yield*/, callGemini(prompt, cache.get(sessionId))];
            case 4:
                result = _b.sent();
                cache.update(sessionId, prompt, result);
                result = "[Gemini \u2014 Workflow Planning]\n\n".concat(result);
                return [3 /*break*/, 10];
            case 5:
                if (!(name === "generate_code")) return [3 /*break*/, 7];
                return [4 /*yield*/, callClaude(prompt, cache.get(sessionId))];
            case 6:
                result = _b.sent();
                cache.update(sessionId, prompt, result);
                result = "[Claude \u2014 Code Generation]\n\n".concat(result);
                return [3 /*break*/, 10];
            case 7:
                if (!(name === "implement_feature")) return [3 /*break*/, 9];
                return [4 /*yield*/, callGPT4o(prompt, cache.get(sessionId))];
            case 8:
                result = _b.sent();
                cache.update(sessionId, prompt, result);
                result = "[GPT-4o \u2014 Implementation]\n\n".concat(result);
                return [3 /*break*/, 10];
            case 9:
                if (name === "clear_context") {
                    cache.clear(sessionId);
                    result = "Context cleared for session: ".concat(sessionId);
                }
                else {
                    throw new Error("Unknown tool: ".concat(name));
                }
                _b.label = 10;
            case 10: return [2 /*return*/, { content: [{ type: "text", text: result }] }];
            case 11:
                err_1 = _b.sent();
                msg = err_1 instanceof Error ? err_1.message : String(err_1);
                return [2 /*return*/, { content: [{ type: "text", text: "Error: ".concat(msg) }], isError: true }];
            case 12: return [2 /*return*/];
        }
    });
}); });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    (0, logger_js_1.log)("LLM Router MCP server running");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
