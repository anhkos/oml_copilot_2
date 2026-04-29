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