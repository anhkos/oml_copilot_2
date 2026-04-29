export interface ILanguageServerClient {
  initialize(workspaceRoot: string): Promise<void>;
  getDiagnostics(uri: string): Promise<Diagnostic[]>;
  shutdown(): Promise<void>;
}

export interface Diagnostic {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  severity: 1 | 2 | 3 | 4;
  message: string;
  source?: string;
}
