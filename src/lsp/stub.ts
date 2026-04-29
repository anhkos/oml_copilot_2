import type { Diagnostic, ILanguageServerClient } from "./types.js";

export class StubLSPClient implements ILanguageServerClient {
  async initialize(_workspaceRoot: string): Promise<void> {
    return;
  }

  async getDiagnostics(_uri: string): Promise<Diagnostic[]> {
    return [];
  }

  async shutdown(): Promise<void> {
    return;
  }
}
