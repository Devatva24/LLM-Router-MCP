# LLM Router MCP

> **Route prompts intelligently across Claude, Gemini, and GPT-4o — automatically picking the best model for every task while minimising token cost.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-SDK%201.x-blueviolet?style=flat-square)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## ✨ What is this?

`llm-router-mcp` is a **Model Context Protocol (MCP) server** that acts as an intelligent dispatcher for your AI workloads. Instead of hardcoding a single LLM into your workflow, the router analyses the intent of each prompt and automatically selects the most cost-effective and capable model for that specific task type.

```
Your prompt ──► LLM Router ──► PLANNING  → Gemini
                            ├── CODEGEN  → Claude
                            ├── TESTING  → GPT-4o
                            └── REVIEW   → Claude
```

---

## 🚀 Features

- **Smart intent-based routing** — classifies prompts into task categories (planning, codegen, testing, review) and dispatches to the optimal model
- **Three frontier models** — integrates Claude (Anthropic), Gemini (Google), and GPT-4o (OpenAI) out of the box
- **Session-aware context caching** — maintains conversation context across turns within the same session, enabling multi-turn workflows
- **Explicit tool shortcuts** — bypass auto-routing with dedicated `plan_workflow` and `implement_feature` tools
- **Mock mode** — run the full server locally without API keys for testing and CI pipelines
- **MCP-native** — drop it into any MCP-compatible host (Claude Desktop, Cursor, VS Code Continue, etc.)

---

## 🗺️ Routing Logic

| Task Category | Trigger Keywords / Tool | Routed To |
|---|---|---|
| **Planning** | Architecture, design, system design, strategy | ✦ Gemini |
| **Code Generation** | Write, implement, build, create a function | ✦ Claude |
| **Testing** | Unit tests, Jest, test suite, test cases | ✦ GPT-4o |
| **Code Review** | Review, what's wrong, analyse, critique | ✦ Claude |
| `plan_workflow` tool | Explicit planning requests | ✦ Gemini |
| `implement_feature` tool | Explicit implementation requests | ✦ GPT-4o |

---

## 📦 Installation

### Prerequisites

- Node.js 20+
- API keys for the models you want to use

### Clone & install

```bash
git clone https://github.com/Devatva24/llm-router.git
cd llm-router
npm install
```

### Build

```bash
npm run build
```

---

## ⚙️ Configuration

Set your API keys as environment variables before starting the server:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=AIza...
export OPENAI_API_KEY=sk-...
```

#### VS Code (Continue)

Add the following to your `%USERPROFILE%/.continue/config.json` (the `cursor-config/` directory in this repo contains ready-made configs):

```json
{
  "mcpServers": {
    "llm-router": {
      "command": "node",
      "args": ["path/to/llm-router/dist/index.js"]
    }
  }
}
```

#### Cursor

Follow the same pattern in your Cursor MCP settings, pointing `args` at the built `dist/index.js`.

---

## 🛠️ Usage

### Start the server

```bash
npm start
```

### Start in mock mode (no API keys needed)

```bash
npm run start:mock
```

### Development mode (TypeScript, no build step)

```bash
npm run dev
```

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

### `implement_feature`
Explicitly routes to **GPT-4o** for feature implementation.

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

The test suite spins up the server in mock mode and validates routing decisions end-to-end:

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
llm-router/
├── src/                    # TypeScript source
│   └── index.ts            # MCP server entrypoint & routing logic
├── dist/                   # Compiled JavaScript (after npm run build)
├── cursor-config/          # Ready-made Cursor MCP config
├── %USERPROFILE%/.continue/# Ready-made Continue MCP config
├── test-router.cjs         # End-to-end test suite (mock mode)
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
