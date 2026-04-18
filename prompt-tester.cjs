/**
 * Interactive prompt tester for LLM Router MCP
 * Usage: node prompt-tester.cjs
 * 
 * Type any prompt and see which model it routes to + the response.
 * Type 'exit' to quit, 'clear' to reset session context.
 */

const { spawn } = require("child_process");
const { createInterface } = require("readline");

// ── Start the MCP server ─────────────────────────────────────────────────────

const server = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

server.on("error", (err) => {
  console.error("❌ Failed to start server:", err.message);
  console.error("   Make sure you ran: npm run build");
  process.exit(1);
});

// Collect server responses by request ID
const responses = new Map();
const pending   = new Map(); // id → resolve function

const serverLines = createInterface({ input: server.stdout });
serverLines.on("line", (line) => {
  try {
    const msg = JSON.parse(line);
    if (msg.id !== undefined) {
      responses.set(msg.id, msg);
      const resolve = pending.get(msg.id);
      if (resolve) {
        pending.delete(msg.id);
        resolve(msg);
      }
    }
  } catch (_) {}
});

// Show server logs (mock mode warning etc.) but keep them subtle
server.stderr.on("data", (d) => {
  const lines = d.toString().trim().split("\n");
  lines.forEach((l) => console.log("  \x1b[2m" + l + "\x1b[0m")); // dim text
});

// ── Helpers ──────────────────────────────────────────────────────────────────

let requestId = 1;
const SESSION_ID = "interactive-session";

function sendRequest(tool, prompt) {
  const id = requestId++;
  const args = prompt ? { prompt, session_id: SESSION_ID } : { session_id: SESSION_ID };
  const msg = JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: tool, arguments: args },
  }) + "\n";

  return new Promise((resolve) => {
    pending.set(id, resolve);
    server.stdin.write(msg);
    // Timeout after 15s in case real API is slow
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve({ error: { message: "Request timed out after 15s" } });
      }
    }, 15000);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function printHelp() {
  console.log("\n  \x1b[36mAvailable commands:\x1b[0m");
  console.log("  \x1b[33m/plan\x1b[0m <prompt>      → force route to Gemini");
  console.log("  \x1b[33m/code\x1b[0m <prompt>      → force route to Claude");
  console.log("  \x1b[33m/implement\x1b[0m <prompt>  → force route to GPT-4o");
  console.log("  \x1b[33m/clear\x1b[0m              → clear session context");
  console.log("  \x1b[33m/help\x1b[0m               → show this menu");
  console.log("  \x1b[33mexit\x1b[0m                → quit\n");
  console.log("  Or just type any prompt to auto-route.\n");
}

// ── Main interactive loop ────────────────────────────────────────────────────

async function main() {
  await sleep(600); // wait for server to boot

  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════╗");
  console.log("║       LLM Router — Interactive       ║");
  console.log("╚══════════════════════════════════════╝\x1b[0m\n");
  printHelp();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question("\x1b[32m You › \x1b[0m", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return ask();

      if (trimmed.toLowerCase() === "exit") {
        console.log("\n  Goodbye!\n");
        server.kill();
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === "/help") {
        printHelp();
        return ask();
      }

      // Determine tool and prompt
      let tool = "route_prompt";
      let prompt = trimmed;

      if (trimmed.startsWith("/plan ")) {
        tool = "plan_workflow";
        prompt = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("/code ")) {
        tool = "generate_code";
        prompt = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("/implement ")) {
        tool = "implement_feature";
        prompt = trimmed.slice(11).trim();
      } else if (trimmed.toLowerCase() === "/clear") {
        tool = "clear_context";
        prompt = "";
      }

      console.log("\n  \x1b[2mRouting...\x1b[0m");
      const res = await sendRequest(tool, prompt);

      const text = res?.result?.content?.[0]?.text;
      const err  = res?.error?.message;

      if (err) {
        console.log("\n  \x1b[31m❌ Error: " + err + "\x1b[0m\n");
      } else if (text) {
        // Extract the routing header [Routed to: X] and print nicely
        const headerMatch = text.match(/^\[(.+?)\]/);
        if (headerMatch) {
          console.log("\n  \x1b[36m" + headerMatch[0] + "\x1b[0m");
          console.log("\n" + text.replace(/^\[.+?\]\n\n/, "") + "\n");
        } else {
          console.log("\n" + text + "\n");
        }
      }

      ask();
    });
  };

  ask();
}

main().catch((err) => {
  console.error("Crashed:", err);
  process.exit(1);
});
