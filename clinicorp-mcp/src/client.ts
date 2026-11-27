import type { Config } from "./config.js";

export type Query = Record<string, string | number | boolean | undefined>;

export class ClinicorpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

type FetchLike = typeof fetch;

/**
 * Cliente HTTP mínimo da API REST da Clinicorp.
 * Autenticação: HTTP Basic com o Usuário API e o Token API.
 */
export class ClinicorpClient {
  private readonly authHeader: string;

  constructor(
    private readonly config: Pick<Config, "apiUser" | "apiToken" | "subscriberId" | "baseUrl" | "timeoutMs">,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.authHeader =
      "Basic " + Buffer.from(`${config.apiUser}:${config.apiToken}`, "utf8").toString("base64");
  }

  get subscriberId(): string {
    return this.config.subscriberId;
  }

  async get(path: string, query: Query = {}): Promise<unknown> {
    return this.request("GET", path, query);
  }

  async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", path, {}, body);
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    query: Query,
    body?: Record<string, unknown>,
  ): Promise<unknown> {
    const url = new URL(this.config.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };
    let payload: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      const reason =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
          ? `a Clinicorp não respondeu em ${Math.round(this.config.timeoutMs / 1000)} s`
          : `falha de rede (${err instanceof Error ? err.message : String(err)})`;
      throw new ClinicorpError(`Não foi possível falar com a Clinicorp: ${reason}.`);
    }

    const text = await response.text();
    const data = parseBody(text);

    if (!response.ok) {
      const detail = text.length > 500 ? text.slice(0, 500) + "…" : text;
      const hint =
        response.status === 401 || response.status === 403
          ? " Confira o Usuário API, o Token API e se o plano tem o módulo API Externa."
          : "";
      throw new ClinicorpError(
        `A Clinicorp recusou ${method} ${path} (HTTP ${response.status}).${hint}` +
          (detail ? ` Resposta: ${detail}` : ""),
        response.status,
      );
    }
    return data;
  }
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
