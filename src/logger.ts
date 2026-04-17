export function log(msg: string): void {
  process.stderr.write("[llm-router] " + new Date().toISOString() + " " + msg + "\n");
}