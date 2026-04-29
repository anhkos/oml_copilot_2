export type RestResult<T> = { ok: true; data: T } | { ok: false; error: string };

export class OmlRestClient {
  constructor(private readonly baseUrl: string) {}

  async health(): Promise<RestResult<unknown>> {
    return this.request("GET", "/health", undefined);
  }

  async lint(): Promise<RestResult<unknown>> {
    return this.request("POST", "/v0/lint", undefined);
  }

  async validate(): Promise<RestResult<unknown>> {
    return this.request("POST", "/v0/validate", undefined);
  }

  async listModels(): Promise<RestResult<unknown>> {
    return this.request("GET", "/v0/models", undefined);
  }

  async fuzzySearch(text: string, limit?: number): Promise<RestResult<unknown>> {
    const body: Record<string, unknown> = { text };
    if (limit !== undefined) body.limit = limit;
    return this.request("POST", "/v0/fuzzysearch", body);
  }

  async update(operations: unknown[], referencingUri?: string): Promise<RestResult<unknown>> {
    const body: Record<string, unknown> = { operations };
    if (referencingUri) body.referencingUri = referencingUri;
    return this.request("POST", "/v0/update", body);
  }

  async assertions(modelUri?: string, format?: string, pretty?: boolean): Promise<RestResult<unknown>> {
    const body: Record<string, unknown> = {};
    if (modelUri) body.modelUri = modelUri;
    if (format) body.format = format;
    if (pretty !== undefined) body.pretty = pretty;
    return this.request("POST", "/v0/assertions", Object.keys(body).length > 0 ? body : undefined);
  }

  private async request(method: string, path: string, body: unknown): Promise<RestResult<unknown>> {
    const url = `${this.baseUrl}${path}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetch(url, {
          method,
          headers: body !== undefined ? { "Content-Type": "application/json" } : {},
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          return { ok: false, error: `${response.status} ${response.statusText}${text ? `: ${text}` : ""}` };
        }
        const data = (await response.json()) as unknown;
        return { ok: true, data };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}