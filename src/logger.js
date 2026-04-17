"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(msg) {
    process.stderr.write("[llm-router] " + new Date().toISOString() + " " + msg + "\n");
}
