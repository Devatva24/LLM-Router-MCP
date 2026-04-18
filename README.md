# LLM Router MCP

> **Route prompts intelligently across Claude, Gemini, and GPT-4o — automatically picking the best model for every task while minimising token cost.**

[![npm](https://img.shields.io/npm/v/llm-router-mcp?style=flat-square&color=cb3837&logo=npm)](https://www.npmjs.com/package/llm-router-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-SDK%201.x-blueviolet?style=flat-square)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## ✨ What is this?

`llm-router-mcp` is a **Model Context Protocol (MCP) server** that acts as an intelligent dispatcher for your AI workloads. Instead of hardcoding a single LLM into your workflow, the router analyses the intent of each prompt and automatically selects the most cost-effective and capable model for that specific task type.

```
Your prompt ──► LLM Router ──► PLANNING      → Gemini
                            ├── SCAFFOLDING  → Gemini
                            ├── CODEGEN      → Claude
                            ├── REFACTOR     → Claude
                            ├── REVIEW       → Claude
                            ├── TESTING      → GPT-4o
                            └── IMPLEMENT    → GPT-4o
```

---

## 🚀 Features

- **Smart intent-based routing** — classifies prompts into 8 task categories and dispatches to the optimal model
- **Three frontier models** — integrates Claude (Anthropic), Gemini (Google), and GPT-4o (OpenAI) out of the box
- **Zero-config mock mode** — works out of the box with no API keys; auto-enables mock mode when keys are absent
- **Session-aware context caching** — maintains conversation context across turns within the same session
- **Explicit tool shortcuts** — bypass auto-routing with dedicated `plan_workflow`, `generate_code`, and `implement_feature` tools
- **MCP-native** — drop it into any MCP-compatible host (Claude Desktop, Cursor, VS Code Continue, etc.)

---

## 📦 Quick Start

### Option A — npx (no install needed)

```bash
npx llm-router-mcp
```

### Option B — Global install

```bash
npm install -g llm-router-mcp
llm-router-mcp
```

### Option C — From source

```bash
git clone https://github.com/Devatva24/LLM-Router-MCP.git
cd LLM-Router-MCP
npm install
npm run build
node dist/index.js
```

> **No API keys?** No problem. The server automatically falls back to mock mode and logs a helpful message. You only need keys when you want real model responses.

---

## 🗺️ Routing Logic

| Task Category | Trigger Keywords | Routed To |
|---|---|---|
| **Planning** | architecture, design, system design, strategy, workflow | ✦ Gemini |
| **Scaffolding** | scaffold, boilerplate, setup, folder structure | ✦ Gemini |
| **Code Generation** | write a function, implement, create a class, algorithm | ✦ Claude |
| **Refactor** | refactor, clean up, improve, rewrite, restructure | ✦ Claude |
| **Code Review** | review, debug, explain, what's wrong, critique | ✦ Claude |
| **Testing** | unit tests, Jest, Vitest, test suite, test cases | ✦ GPT-4o |
| **Implementation** | implement, add endpoint, build the, create the API | ✦ GPT-4o |
| **General** | anything else | ✦ Claude (fallback) |

---

## ⚙️ Configuration

Set your API keys as environment variables to use real models:

```bash
# Mac / Linux
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=AIza...
export OPENAI_API_KEY=sk-...

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:GOOGLE_API_KEY="AIza..."
$env:OPENAI_API_KEY="sk-..."
```

If any keys are missing the server auto-enables mock mode — no crash, no config needed.

---

## 🖥️ Editor Integration

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "llm-router": {
      "command": "npx",
      "args": ["llm-router-mcp"]
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "llm-router": {
      "command": "npx",
      "args": ["llm-router-mcp"]
    }
  }
}
```

### VS Code (Continue extension)

Add to `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "llm-router": {
      "command": "npx",
      "args": ["llm-router-mcp"]
    }
  }
}
```

> Ready-made config files for Cursor and Continue are included in the `cursor-config/` and `%USERPROFILE%/.continue/` directories of this repo.

---

## 🧰 Available MCP Tools

### `route_prompt`
Automatically classifies and routes a prompt to the best model.

```json
{
  "prompt": "Write a recursive function to flatten deeply nested objects",
  "session_id": "my-session"
}
```

### `plan_workflow`
Explicitly routes to **Gemini** for high-level planning and architecture tasks.

```json
{
  "prompt": "Design a checkout flow for an e-commerce app",
  "session_id": "my-session"
}
```

### `generate_code`
Explicitly routes to **Claude** for complex logic, algorithms, and refactoring.

```json
{
  "prompt": "Write a binary search tree with insert and delete",
  "session_id": "my-session"
}
```

### `implement_feature`
Explicitly routes to **GPT-4o** for feature implementation and test generation.

```json
{
  "prompt": "Implement the /api/products CRUD endpoints",
  "session_id": "my-session"
}
```

### `clear_context`
Clears the cached conversation context for a given session.

```json
{
  "session_id": "my-session"
}
```

---

## 🧪 Running Tests

The test suite validates all routing decisions in mock mode — no API keys needed:

```bash
npm test
```

Expected output:

```
🧪 LLM Router — mock test suite

  ✅ planning → Gemini
  ✅ codegen → Claude
  ✅ testing → GPT-4o
  ✅ review → Claude
  ✅ explicit plan_workflow
  ✅ explicit implement_feature
  ✅ context cache — 2nd turn
  ✅ clear_context

──────────────────────────────────────────
  8 passed  0 failed (8 total)
```

---

## 📁 Project Structure

```
LLM-Router-MCP/
├── src/
│   ├── index.ts          # MCP server entrypoint & routing logic
│   ├── classifier.ts     # Prompt intent classifier
│   ├── context-cache.ts  # Session-aware context management
│   ├── mock.ts           # Mock responses for zero-cost testing
│   └── logger.ts         # Lightweight logger
├── dist/                 # Compiled JavaScript (after npm run build)
├── cursor-config/        # Ready-made Cursor MCP config
├── test-router.cjs       # End-to-end test suite (mock mode)
├── tsconfig.json
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request for:

- Adding support for additional LLM providers
- Improving routing classification accuracy
- Adding streaming response support
- Writing more test coverage

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
