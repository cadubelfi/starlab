/**
 * Configuração lida das variáveis de ambiente.
 *
 * O conector é só leitura por padrão. Cada gravação na Clinicorp precisa ser
 * liberada pelo nome em CLINICORP_GRAVACOES_LIBERADAS.
 */

export const WRITE_ACTIONS = [
  "criar_agendamento",
  "confirmar_agendamento",
  "criar_paciente",
  "adicionar_lead",
] as const;

export type WriteAction = (typeof WRITE_ACTIONS)[number];

export interface Config {
  apiUser: string;
  apiToken: string;
  subscriberId: string;
  baseUrl: string;
  timeoutMs: number;
  /** Gravações liberadas. Vazio = só leitura. */
  writes: ReadonlySet<WriteAction>;
  /** Arquivo .jsonl onde cada gravação é registrada (opcional). */
  writeLogPath?: string;
  /** Tamanho máximo, em caracteres, da resposta devolvida à IA. */
  maxResponseChars: number;
}

export const DEFAULT_BASE_URL = "https://api.clinicorp.com/rest/v1";

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const required = {
    CLINICORP_API_USER: env.CLINICORP_API_USER?.trim() ?? "",
    CLINICORP_API_TOKEN: env.CLINICORP_API_TOKEN?.trim() ?? "",
    CLINICORP_SUBSCRIBER_ID: env.CLINICORP_SUBSCRIBER_ID?.trim() ?? "",
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new ConfigError(
      `Faltam variáveis de ambiente: ${missing.join(", ")}. ` +
        "Copie o Usuário API, o Token API e o ID do assinante em Gerenciar Assinatura → " +
        "Acesso Externo e Integrações, na Clinicorp.",
    );
  }

  const writes = parseWrites(env.CLINICORP_GRAVACOES_LIBERADAS ?? "");

  const timeoutMs = parsePositiveInt(env.CLINICORP_TIMEOUT_MS, 30_000, "CLINICORP_TIMEOUT_MS");
  const maxResponseChars = parsePositiveInt(
    env.CLINICORP_MAX_CARACTERES,
    60_000,
    "CLINICORP_MAX_CARACTERES",
  );

  return {
    apiUser: required.CLINICORP_API_USER,
    apiToken: required.CLINICORP_API_TOKEN,
    subscriberId: required.CLINICORP_SUBSCRIBER_ID,
    baseUrl: (env.CLINICORP_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    timeoutMs,
    writes,
    writeLogPath: env.CLINICORP_LOG_GRAVACOES?.trim() || undefined,
    maxResponseChars,
  };
}

export function parseWrites(raw: string): ReadonlySet<WriteAction> {
  const names = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const unknown = names.filter((n) => !(WRITE_ACTIONS as readonly string[]).includes(n));
  if (unknown.length > 0) {
    throw new ConfigError(
      `Gravação desconhecida em CLINICORP_GRAVACOES_LIBERADAS: ${unknown.join(", ")}. ` +
        `Use uma ou mais destas, separadas por vírgula: ${WRITE_ACTIONS.join(", ")}.`,
    );
  }
  return new Set(names as WriteAction[]);
}

function parsePositiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new ConfigError(`${name} precisa ser um número inteiro positivo.`);
  }
  return value;
}
