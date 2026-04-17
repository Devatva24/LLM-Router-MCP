"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextCache = void 0;
const logger_js_1 = require("./logger.js");
const MAX_SUMMARY_CHARS = 1200; // ~300 tokens — tight cap to save money
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle expiry
class ContextCache {
    sessions = new Map();
    get(sessionId) {
        this.evictStale();
        return this.sessions.get(sessionId)?.summary ?? "";
    }
    update(sessionId, userPrompt, assistantResponse) {
        const existing = this.sessions.get(sessionId);
        const turnCount = (existing?.turnCount ?? 0) + 1;
        // Build a compressed summary rather than keeping raw history
        const newEntry = this.compress(existing?.summary ?? "", userPrompt, assistantResponse, turnCount);
        this.sessions.set(sessionId, {
            summary: newEntry,
            turnCount,
            lastUpdated: Date.now(),
        });
        (0, logger_js_1.log)(`context updated — session="${sessionId}" turns=${turnCount} chars=${newEntry.length}`);
    }
    clear(sessionId) {
        if (sessionId) {
            this.sessions.delete(sessionId);
            (0, logger_js_1.log)(`context cleared — session="${sessionId}"`);
        }
        else {
            this.sessions.clear();
            (0, logger_js_1.log)("all contexts cleared");
        }
    }
    compress(existingSummary, userPrompt, assistantResponse, turn) {
        // Keep only the last ~200 chars of the assistant response (the conclusion)
        const responseTail = assistantResponse.slice(-200).replace(/\n+/g, " ").trim();
        // Truncate user prompt to 120 chars
        const promptSnippet = userPrompt.slice(0, 120).replace(/\n+/g, " ").trim();
        const newTurn = `[Turn ${turn}] User: ${promptSnippet} | Assistant concluded: ${responseTail}`;
        // Append new turn, then trim from the front if over budget
        const combined = existingSummary
            ? `${existingSummary}\n${newTurn}`
            : newTurn;
        if (combined.length <= MAX_SUMMARY_CHARS)
            return combined;
        // Drop oldest turns until under budget
        const lines = combined.split("\n");
        while (lines.join("\n").length > MAX_SUMMARY_CHARS && lines.length > 1) {
            lines.shift();
        }
        return lines.join("\n");
    }
    evictStale() {
        const now = Date.now();
        for (const [id, entry] of this.sessions) {
            if (now - entry.lastUpdated > SESSION_TTL_MS) {
                this.sessions.delete(id);
                (0, logger_js_1.log)(`evicted stale session="${id}"`);
            }
        }
    }
}
exports.ContextCache = ContextCache;
