import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ConfigError, loadConfig, parseWrites, type Config } from "../config.js";
import { ClinicorpClient } from "../client.js";
import { createServer } from "../server.js";

interface Call {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body?: unknown;
}

function fakeFetch(respond: (call: Call) => { status?: number; body?: unknown } = () => ({ body: { ok: true } })) {
  const calls: Call[] = [];
  const impl = (async (input: URL | string, init?: RequestInit) => {
    const call: Call = {
      method: init?.method ?? "GET",
      url: new URL(String(input)),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const r = respond(call);
    const text = typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? null);
    return new Response(text, { status: r.status ?? 200 });
  }) as typeof fetch;
  return { impl, calls };
}

const baseEnv = {
  CLINICORP_API_USER: "usuario",
  CLINICORP_API_TOKEN: "segredo",
  CLINICORP_SUBSCRIBER_ID: "assinante-1",
};

function config(extra: Record<string, string> = {}): Config {
  return loadConfig({ ...baseEnv, ...extra });
}

async function connect(cfg: Config, fetchImpl: typeof fetch) {
  const server = createServer(cfg, fetchImpl);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "teste", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

function text(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content.map((c) => c.text).join("\n");
}

// ------------------------------------------------------------ Configuração

test("config: exige usuário, token e ID do assinante", () => {
  assert.throws(() => loadConfig({}), (err: unknown) => {
    assert.ok(err instanceof ConfigError);
    assert.match(err.message, /CLINICORP_API_USER, CLINICORP_API_TOKEN, CLINICORP_SUBSCRIBER_ID/);
    return true;
  });
});

test("config: só leitura por padrão e base padrão da API", () => {
  const cfg = config();
  assert.equal(cfg.writes.size, 0);
  assert.equal(cfg.baseUrl, "https://api.clinicorp.com/rest/v1");
});

test("config: libera gravações pelo nome e recusa nomes desconhecidos", () => {
  assert.deepEqual([...parseWrites(" criar_agendamento , ADICIONAR_LEAD ")], ["criar_agendamento", "adicionar_lead"]);
  assert.throws(() => parseWrites("cancelar_agendamento"), ConfigError);
});

// ------------------------------------------------------------ Cliente HTTP

test("cliente: usa HTTP Basic e monta a query sem campos vazios", async () => {
  const { impl, calls } = fakeFetch();
  const client = new ClinicorpClient(config(), impl);
  await client.get("/appointment/list", { a: "1", b: undefined, c: "" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.toString(), "https://api.clinicorp.com/rest/v1/appointment/list?a=1");
  assert.equal(calls[0].headers.Authorization, "Basic " + Buffer.from("usuario:segredo").toString("base64"));
});

test("cliente: erro 401 vira mensagem clara sem expor o token", async () => {
  const { impl } = fakeFetch(() => ({ status: 401, body: "unauthorized" }));
  const client = new ClinicorpClient(config(), impl);
  await assert.rejects(client.get("/business/list"), (err: Error) => {
    assert.match(err.message, /HTTP 401/);
    assert.match(err.message, /módulo API Externa/);
    assert.doesNotMatch(err.message, /segredo/);
    return true;
  });
});

// ------------------------------------------------------------ Servidor MCP

test("servidor: em modo só leitura não expõe nenhuma ferramenta de gravação", async () => {
  const { impl } = fakeFetch();
  const client = await connect(config(), impl);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  assert.ok(names.includes("clinicorp_listar_agendamentos"));
  assert.ok(names.includes("clinicorp_horarios_disponiveis"));
  assert.ok(!names.some((n) => /criar|confirmar|adicionar/.test(n)), names.join(", "));
  assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true));
});

test("servidor: só a gravação liberada aparece", async () => {
  const { impl } = fakeFetch();
  const client = await connect(config({ CLINICORP_GRAVACOES_LIBERADAS: "criar_agendamento" }), impl);
  const names = (await client.listTools()).tools.map((t) => t.name);
  assert.ok(names.includes("clinicorp_criar_agendamento"));
  assert.ok(!names.includes("clinicorp_criar_paciente"));
  assert.ok(!names.includes("clinicorp_confirmar_agendamento"));
});

test("listar agendamentos: envia subscriber_id, período e clínica", async () => {
  const { impl, calls } = fakeFetch(() => ({ body: [{ id: 1 }] }));
  const client = await connect(config(), impl);
  const result = await client.callTool({
    name: "clinicorp_listar_agendamentos",
    arguments: { clinica_id: 42, data_inicial: "2026-12-01", data_final: "2026-12-01" },
  });
  assert.equal(result.isError, undefined);
  const q = calls[0].url.searchParams;
  assert.equal(calls[0].url.pathname, "/rest/v1/appointment/list");
  assert.equal(q.get("subscriber_id"), "assinante-1");
  assert.equal(q.get("from"), "2026-12-01");
  assert.equal(q.get("businessId"), "42");
  assert.equal(q.has("includeCanceled"), false);
  assert.match(text(result), /"id": 1/);
});

test("horários disponíveis: datas vão no formato compacto AAAAMMDD", async () => {
  const { impl, calls } = fakeFetch();
  const client = await connect(config(), impl);
  await client.callTool({
    name: "clinicorp_horarios_disponiveis",
    arguments: { profissional_id: "7", clinica_id: "42", data_inicial: "2026-12-01", data_final: "2026-12-05" },
  });
  const q = calls[0].url.searchParams;
  assert.equal(q.get("fromDate"), "20261201");
  assert.equal(q.get("toDate"), "20261205");
  assert.equal(q.get("professionalId"), "7");
});

test("datas inválidas são recusadas antes de chamar a API", async () => {
  const { impl, calls } = fakeFetch();
  const client = await connect(config(), impl);
  const result = await client.callTool({
    name: "clinicorp_listar_orcamentos",
    arguments: { data_inicial: "01/12/2026", data_final: "2026-12-31" },
  });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

test("buscar paciente: exige ao menos um filtro", async () => {
  const { impl, calls } = fakeFetch();
  const client = await connect(config(), impl);
  const result = await client.callTool({ name: "clinicorp_buscar_paciente", arguments: {} });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

test("erro da API volta como isError, sem derrubar o servidor", async () => {
  const { impl } = fakeFetch(() => ({ status: 500, body: "falhou" }));
  const client = await connect(config(), impl);
  const result = await client.callTool({ name: "clinicorp_listar_clinicas", arguments: {} });
  assert.equal(result.isError, true);
  assert.match(text(result), /HTTP 500/);
});

test("resposta grande é cortada", async () => {
  const { impl } = fakeFetch(() => ({ body: "x".repeat(500) }));
  const client = await connect(config({ CLINICORP_MAX_CARACTERES: "100" }), impl);
  const result = await client.callTool({ name: "clinicorp_listar_procedimentos", arguments: {} });
  assert.match(text(result), /Resposta cortada em 100 caracteres/);
});

test("criar agendamento: mapeia os campos e registra a gravação", async () => {
  const dir = await mkdtemp(join(tmpdir(), "clinicorp-mcp-"));
  const logPath = join(dir, "gravacoes.jsonl");
  const { impl, calls } = fakeFetch(() => ({ body: { id: 99 } }));
  const client = await connect(
    config({ CLINICORP_GRAVACOES_LIBERADAS: "criar_agendamento", CLINICORP_LOG_GRAVACOES: logPath }),
    impl,
  );
  const result = await client.callTool({
    name: "clinicorp_criar_agendamento",
    arguments: {
      nome_paciente: "Maria Teste",
      data: "2026-12-03",
      hora_inicio: "09:00",
      hora_fim: "09:40",
      clinica_id: "42",
      profissional_id: "7",
      procedimentos: ["Avaliação", "Limpeza"],
    },
  });
  assert.equal(result.isError, undefined);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url.pathname, "/rest/v1/appointment/create_appointment_by_api");
  assert.deepEqual(calls[0].body, {
    PatientName: "Maria Teste",
    date: "2026-12-03",
    fromTime: "09:00",
    toTime: "09:40",
    Clinic_BusinessId: "42",
    Dentist_PersonId: "7",
    Procedures: "Avaliação,Limpeza",
  });
  const log = (await readFile(logPath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(log.length, 1);
  assert.equal(log[0].acao, "criar_agendamento");
  assert.equal(log[0].status, "ok");
});

test("criar agendamento: recusa horário final antes do inicial", async () => {
  const { impl, calls } = fakeFetch();
  const client = await connect(config({ CLINICORP_GRAVACOES_LIBERADAS: "criar_agendamento" }), impl);
  const result = await client.callTool({
    name: "clinicorp_criar_agendamento",
    arguments: {
      nome_paciente: "Maria",
      data: "2026-12-03",
      hora_inicio: "10:00",
      hora_fim: "09:00",
      clinica_id: "1",
      profissional_id: "2",
    },
  });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});
