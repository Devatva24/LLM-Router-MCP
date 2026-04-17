export declare class ContextCache {
    private sessions;
    get(sessionId: string): string;
    update(sessionId: string, userPrompt: string, assistantResponse: string): void;
    clear(sessionId?: string): void;
    private compress;
    private evictStale;
}
