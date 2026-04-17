import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "./logger.js";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type TaskType =
  | "planning"
  | "scaffolding"
  | "codegen"
  | "refactor"
  | "review"
  | "implementation"
  | "testing"
  | "general";

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

export async function classifyTask(prompt: string): Promise<TaskType> {
  try {
    // Use Flash for classification — cheapest, fastest
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(CLASSIFIER_PROMPT + prompt);
    const label = result.response.text().trim().toLowerCase() as TaskType;

    const valid: TaskType[] = [
      "planning", "scaffolding", "codegen", "refactor",
      "review", "implementation", "testing", "general",
    ];

    if (valid.includes(label)) {
      log(`classified as: ${label}`);
      return label;
    }
    log(`unexpected label "${label}", falling back to general`);
    return "general";
  } catch (err) {
    log(`classifier error, falling back to general: ${err}`);
    return "general";
  }
}
