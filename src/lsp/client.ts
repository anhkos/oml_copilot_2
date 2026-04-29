import type { Diagnostic, ILanguageServerClient } from "./types.js";

export class RealLSPClient implements ILanguageServerClient {
  async initialize(_workspaceRoot: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  async getDiagnostics(_uri: string): Promise<Diagnostic[]> {
    throw new Error("Not yet implemented");
  }

  async shutdown(): Promise<void> {
    throw new Error("Not yet implemented");
  }
}
