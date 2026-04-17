"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyTask = classifyTask;
const generative_ai_1 = require("@google/generative-ai");
const logger_js_1 = require("./logger.js");
const genai = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const CLASSIFIER_PROMPT = `You are a task classifier for a coding assistant. Given a user prompt, output EXACTLY one of these labels — nothing else:

planning       → user wants a high-level plan, architecture, or workflow design
scaffolding    → user wants file structure, boilerplate, or project setup
codegen        → user wants complex logic, algorithms, or nuanced code written
refactor       → user wants existing code improved, cleaned up, or restructured
review         → user wants code reviewed, explained, or debugged
implementation → user wants a straightforward feature implemented
testing        → user wants tests written (unit, integration, e2e)
general        → anything else

Respond with ONLY the label word. No punctuation, no explanation.

Prompt: `;
async function classifyTask(prompt) {
    try {
        // Use Flash for classification — cheapest, fastest
        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(CLASSIFIER_PROMPT + prompt);
        const label = result.response.text().trim().toLowerCase();
        const valid = [
            "planning", "scaffolding", "codegen", "refactor",
            "review", "implementation", "testing", "general",
        ];
        if (valid.includes(label)) {
            (0, logger_js_1.log)(`classified as: ${label}`);
            return label;
        }
        (0, logger_js_1.log)(`unexpected label "${label}", falling back to general`);
        return "general";
    }
    catch (err) {
        (0, logger_js_1.log)(`classifier error, falling back to general: ${err}`);
        return "general";
    }
}
