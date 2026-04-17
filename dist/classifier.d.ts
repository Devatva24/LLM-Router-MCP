export type TaskType = "planning" | "scaffolding" | "codegen" | "refactor" | "review" | "implementation" | "testing" | "general";
export declare function classifyTask(prompt: string): Promise<TaskType>;
