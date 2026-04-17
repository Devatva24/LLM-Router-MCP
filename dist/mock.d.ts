/**
 * Mock model responses for zero-cost testing.
 * Enable with: MOCK_MODE=true node dist/index.js
 *
 * Each mock returns a realistic-looking response so you can verify:
 *   - Routing logic (right model picked for the task)
 *   - Context cache (compression + session continuity)
 *   - Cursor MCP integration (tool calls, responses)
 *   - Classifier labels
 */
import { TaskType } from "./classifier.js";
export declare const MOCK_MODE: boolean;
export declare function mockClassify(prompt: string): TaskType;
export declare function mockCallClaude(prompt: string): Promise<string>;
export declare function mockCallGemini(prompt: string): Promise<string>;
export declare function mockCallGPT4o(prompt: string): Promise<string>;
