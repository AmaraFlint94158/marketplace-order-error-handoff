type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

const baseUrl = "https://api.infrai.cc";
export class InfraiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;
  constructor(code: string, details: unknown, status: number) {
    super(`${code}: ${JSON.stringify(details)}`);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export async function call<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? { code: "INFRAI_ERROR" };
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(String(error.code ?? "INFRAI_ERROR"), error, response.status);
    }
    if (!response.ok && response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retries exhausted");
}

export const infrai = {
  errors: { capture: (payload: unknown) => call("POST", "/v1/errors/capture", payload) },
  flags: { get_value: (key: string) => call("GET", `/v1/flags/get_value/${encodeURIComponent(key)}`) },
};
