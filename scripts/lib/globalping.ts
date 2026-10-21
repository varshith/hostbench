export interface GpLocation { country?: string; state?: string; continent?: string; city?: string; limit?: number; magic?: string }

export interface GpCreateRequest {
  type: 'http';
  target: string;
  locations: GpLocation[];
  timeout?: number;
  measurementOptions: {
    request: { path?: string; query?: string; method: 'GET' | 'HEAD' | 'OPTIONS'; headers?: Record<string, string> };
    protocol: 'HTTP' | 'HTTPS' | 'HTTP2';
    port?: number;
  };
}

export interface GpProbe {
  continent: string; region: string; country: string; state: string | null; city: string;
  asn: number; network: string; latitude: number; longitude: number; tags: string[];
}

export interface GpHttpResult {
  status: 'finished' | 'failed' | 'offline' | 'in-progress';
  rawOutput: string;
  failureSource?: 'target' | 'resolver' | 'internal';
  resolvedAddress?: string | null;
  headers?: Record<string, string | string[]>;
  rawHeaders?: string;
  rawBody?: string | null;
  truncated?: boolean;
  statusCode?: number;
  statusCodeName?: string;
  timings?: { total: number; dns: number | null; tcp: number; tls: number | null; firstByte: number; download: number };
  tls?: { protocol: string; cipherName: string; authorized: boolean; error?: string; issuer?: { CN?: string } } | null;
}

export interface GpMeasurement {
  id: string;
  type: string;
  target: string;
  status: 'in-progress' | 'finished';
  createdAt: string;
  updatedAt: string;
  probesCount: number;
  results: { probe: GpProbe; result: GpHttpResult }[];
}

export interface GpRateLimit { limit: number | null; remaining: number | null; reset: number | null }

export class GlobalpingRateLimited extends Error {
  constructor(public rateLimit: GpRateLimit, public retryAfterSeconds: number | null) {
    super(`Globalping rate limit reached (remaining=${rateLimit.remaining}, reset in ${rateLimit.reset}s)`);
  }
}

// A hung connection would otherwise stall the hourly job until the Actions timeout and block later runs.
export const REQUEST_TIMEOUT_MS = 30_000;

export class GlobalpingClient {
  constructor(private apiBase: string, private token: string | undefined, private userAgent: string) {}

  get authenticated(): boolean {
    return Boolean(this.token);
  }

  private headers(json = false): Record<string, string> {
    const h: Record<string, string> = { 'User-Agent': this.userAgent, Accept: 'application/json' };
    if (json) h['Content-Type'] = 'application/json';
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  private fetch(url: string, init: RequestInit = {}): Promise<Response> {
    return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  }

  static rateLimitFrom(res: Response): GpRateLimit {
    const num = (k: string) => { const v = res.headers.get(k); return v == null ? null : Number(v); };
    return { limit: num('x-ratelimit-limit'), remaining: num('x-ratelimit-remaining'), reset: num('x-ratelimit-reset') };
  }

  async limits(): Promise<{ limit: number; remaining: number; reset: number; type: string } | null> {
    const res = await this.fetch(`${this.apiBase}/limits`, { headers: this.headers() });
    if (!res.ok) return null;
    const body = (await res.json()) as { rateLimit?: { measurements?: { create?: { limit: number; remaining: number; reset: number; type: string } } } };
    return body.rateLimit?.measurements?.create ?? null;
  }

  async create(req: GpCreateRequest): Promise<{ id: string; probesCount: number; rateLimit: GpRateLimit }> {
    const res = await this.fetch(`${this.apiBase}/measurements`, {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(req),
    });
    const rateLimit = GlobalpingClient.rateLimitFrom(res);
    if (res.status === 429) {
      const ra = res.headers.get('retry-after');
      throw new GlobalpingRateLimited(rateLimit, ra ? Number(ra) : null);
    }
    if (res.status !== 202) {
      const text = await res.text();
      throw new Error(`Globalping create failed: HTTP ${res.status} ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as { id: string; probesCount: number };
    return { id: body.id, probesCount: body.probesCount, rateLimit };
  }

  async get(id: string): Promise<GpMeasurement> {
    const res = await this.fetch(`${this.apiBase}/measurements/${id}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Globalping get ${id} failed: HTTP ${res.status}`);
    return (await res.json()) as GpMeasurement;
  }

  /** Polls per the API guidelines: wait pollIntervalMs after each response, never a fixed interval. */
  async waitForFinished(id: string, pollIntervalMs: number, pollTimeoutMs: number): Promise<GpMeasurement> {
    const deadline = Date.now() + pollTimeoutMs;
    let last: GpMeasurement | null = null;
    while (Date.now() < deadline) {
      last = await this.get(id);
      if (last.status === 'finished') return last;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    if (last) return last;
    throw new Error(`Globalping measurement ${id} did not finish within ${pollTimeoutMs}ms`);
  }
}
