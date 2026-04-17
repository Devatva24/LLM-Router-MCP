const { spawn } = require("child_process");
const { createInterface } = require("readline");

const TESTS = [
  { label: "planning → Gemini", tool: "route_prompt", prompt: "Plan the architecture for a multi-tenant SaaS billing system", session: "test-1", expect: "PLANNING" },
  { label: "codegen → Claude", tool: "route_prompt", prompt: "Write a recursive function to flatten deeply nested objects", session: "test-1", expect: "CODEGEN" },
  { label: "testing → GPT-4o", tool: "route_prompt", prompt: "Write Jest unit tests for a UserService class", session: "test-1", expect: "TESTING" },
  { label: "review → Claude", tool: "route_prompt", prompt: "Review this code and tell me what is wrong with it", session: "test-2", expect: "REVIEW" },
  { label: "explicit plan_workflow", tool: "plan_workflow", prompt: "Design a checkout flow for an e-commerce app", session: "test-2", expect: "Gemini" },
  { label: "explicit implement_feature", tool: "implement_feature", prompt: "Implement the /api/products CRUD endpoints", session: "test-2", expect: "GPT-4o" },
  { label: "context cache — 2nd turn", tool: "route_prompt", prompt: "Now add pagination to those endpoints", session: "test-2", expect: "handler" },
  { label: "clear_context", tool: "clear_context", prompt: "", session: "test-2", expect: "cleared" },
];

function buildRequest(id, tool, prompt, session) {
  const args = prompt ? { prompt, session_id: session } : { session_id: session };
  return JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name: tool, arguments: args } }) + "\n";
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runTests() {
  console.log("\n🧪 LLM Router — mock test suite\n");

  const server = spawn("node", ["dist/index.js"], {
    env: { ...process.env, MOCK_MODE: "true" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  server.stderr.on("data", (d) => process.stdout.write("  [server] " + d.toString()));
  server.on("error", (err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

  const responses = new Map();
  const rl = createInterface({ input: server.stdout });
  rl.on("line", (line) => {
    try { const msg = JSON.parse(line); if (msg.id !== undefined) responses.set(msg.id, msg); } catch (_) {}
  });

  await sleep(500);

  let passed = 0, failed = 0;

  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    const id = i + 1;
    server.stdin.write(buildRequest(id, t.tool, t.prompt, t.session));
    await sleep(700);

    const res = responses.get(id);
    const text = res?.result?.content?.[0]?.text ?? res?.error?.message ?? "(no response)";
    const ok = text.toLowerCase().includes(t.expect.toLowerCase());

    if (ok) { console.log("  ✅ " + t.label); passed++; }
    else {
      console.log("  ❌ " + t.label);
      console.log('     expected: "' + t.expect + '"');
      console.log('     got: "' + text.slice(0, 120) + '..."');
      failed++;
    }
  }

  console.log("\n" + "─".repeat(42));
  console.log("  " + passed + " passed  " + failed + " failed  (" + TESTS.length + " total)\n");
  server.kill();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => { console.error("Crashed:", err); process.exit(1); });