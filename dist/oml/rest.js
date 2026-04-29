export class OmlRestClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async health() {
        return this.request("GET", "/health", undefined);
    }
    async lint() {
        return this.request("POST", "/v0/lint", undefined);
    }
    async validate() {
        return this.request("POST", "/v0/validate", undefined);
    }
    async request(method, path, body) {
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
                const data = (await response.json());
                return { ok: true, data };
            }
            finally {
                clearTimeout(timeout);
            }
        }
        catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}
