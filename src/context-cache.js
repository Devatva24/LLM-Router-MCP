"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextCache = void 0;
var logger_js_1 = require("./logger.js");
var MAX_SUMMARY_CHARS = 1200; // ~300 tokens — tight cap to save money
var SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle expiry
var ContextCache = /** @class */ (function () {
    function ContextCache() {
        this.sessions = new Map();
    }
    ContextCache.prototype.get = function (sessionId) {
        var _a, _b;
        this.evictStale();
        return (_b = (_a = this.sessions.get(sessionId)) === null || _a === void 0 ? void 0 : _a.summary) !== null && _b !== void 0 ? _b : "";
    };
    ContextCache.prototype.update = function (sessionId, userPrompt, assistantResponse) {
        var _a, _b;
        var existing = this.sessions.get(sessionId);
        var turnCount = ((_a = existing === null || existing === void 0 ? void 0 : existing.turnCount) !== null && _a !== void 0 ? _a : 0) + 1;
        // Build a compressed summary rather than keeping raw history
        var newEntry = this.compress((_b = existing === null || existing === void 0 ? void 0 : existing.summary) !== null && _b !== void 0 ? _b : "", userPrompt, assistantResponse, turnCount);
        this.sessions.set(sessionId, {
            summary: newEntry,
            turnCount: turnCount,
            lastUpdated: Date.now(),
        });
        (0, logger_js_1.log)("context updated \u2014 session=\"".concat(sessionId, "\" turns=").concat(turnCount, " chars=").concat(newEntry.length));
    };
    ContextCache.prototype.clear = function (sessionId) {
        if (sessionId) {
            this.sessions.delete(sessionId);
            (0, logger_js_1.log)("context cleared \u2014 session=\"".concat(sessionId, "\""));
        }
        else {
            this.sessions.clear();
            (0, logger_js_1.log)("all contexts cleared");
        }
    };
    ContextCache.prototype.compress = function (existingSummary, userPrompt, assistantResponse, turn) {
        // Keep only the last ~200 chars of the assistant response (the conclusion)
        var responseTail = assistantResponse.slice(-200).replace(/\n+/g, " ").trim();
        // Truncate user prompt to 120 chars
        var promptSnippet = userPrompt.slice(0, 120).replace(/\n+/g, " ").trim();
        var newTurn = "[Turn ".concat(turn, "] User: ").concat(promptSnippet, " | Assistant concluded: ").concat(responseTail);
        // Append new turn, then trim from the front if over budget
        var combined = existingSummary
            ? "".concat(existingSummary, "\n").concat(newTurn)
            : newTurn;
        if (combined.length <= MAX_SUMMARY_CHARS)
            return combined;
        // Drop oldest turns until under budget
        var lines = combined.split("\n");
        while (lines.join("\n").length > MAX_SUMMARY_CHARS && lines.length > 1) {
            lines.shift();
        }
        return lines.join("\n");
    };
    ContextCache.prototype.evictStale = function () {
        var now = Date.now();
        for (var _i = 0, _a = this.sessions; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], entry = _b[1];
            if (now - entry.lastUpdated > SESSION_TTL_MS) {
                this.sessions.delete(id);
                (0, logger_js_1.log)("evicted stale session=\"".concat(id, "\""));
            }
        }
    };
    return ContextCache;
}());
exports.ContextCache = ContextCache;
