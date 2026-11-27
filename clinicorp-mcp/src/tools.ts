import { appendFile } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ClinicorpClient, ClinicorpError } from "./client.js";
import type { Config, WriteAction } from "./config.js";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD, por exemplo 2026-12-03.")
  .describe("Data no formato AAAA-MM-DD");

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM, por exemplo 09:30.")
  .describe("Horário no formato HH:MM (24 h)");

const id = z
  .union([z.string().min(1), z.number().int()])
  .transform((v) => String(v));

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

const WRITE_NOTE =
  " GRAVA NA CLINICORP: use só depois do OK explícito do dentista para esta ação específica.";

/** Junta o resultado da API num texto para a IA, cortando respostas grandes. */
export function formatResult(data: unknown, maxChars: number): CallToolResult {
  let text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  if (text === undefined || text === "null") text = "A Clinicorp não devolveu conteúdo.";
  if (text.length > maxChars) {
    text =
      text.slice(0, maxChars) +
      `\n\n[Resposta cortada em ${maxChars} caracteres. Use um período menor ou filtros mais específicos.]`;
  }
  return { content: [{ type: "text", text }] };
}

function errorResult(err: unknown): CallToolResult {
  const message =
    err instanceof ClinicorpError
      ? err.message
      : `Erro inesperado no conector: ${err instanceof Error ? err.message : String(err)}`;
  return { content: [{ type: "text", text: message }], isError: true };
}

function compactDate(value: string): string {
  return value.replace(/-/g, "");
}

export function registerTools(server: McpServer, client: ClinicorpClient, config: Config): void {
  const sid = client.subscriberId;

  const run = async (fn: () => Promise<unknown>): Promise<CallToolResult> => {
    try {
      return formatResult(await fn(), config.maxResponseChars);
    } catch (err) {
      return errorResult(err);
    }
  };

  const runWrite = async (
    action: WriteAction,
    input: Record<string, unknown>,
    fn: () => Promise<unknown>,
  ): Promise<CallToolResult> => {
    try {
      const data = await fn();
      await logWrite(config.writeLogPath, action, input, "ok");
      return formatResult(data, config.maxResponseChars);
    } catch (err) {
      await logWrite(config.writeLogPath, action, input, "erro", err);
      return errorResult(err);
    }
  };

  // ---------------------------------------------------------------- Leitura

  server.registerTool(
    "clinicorp_listar_clinicas",
    {
      title: "Listar clínicas",
      description:
        "Lista as clínicas (unidades) da assinatura, com seus IDs. Use para descobrir o ID da clínica pedido por outras ferramentas.",
      annotations: READ_ONLY,
    },
    () => run(() => client.get("/business/list", { subscriber_id: sid })),
  );

  server.registerTool(
    "clinicorp_listar_profissionais",
    {
      title: "Listar profissionais",
      description:
        "Lista os dentistas e demais profissionais cadastrados, com seus IDs. Também serve para testar se a conexão com a Clinicorp funciona.",
      inputSchema: {
        somente_agendamento_online: z
          .boolean()
          .optional()
          .describe("Se verdadeiro, só os profissionais disponíveis no agendamento online"),
      },
      annotations: READ_ONLY,
    },
    ({ somente_agendamento_online }) =>
      run(() =>
        client.get("/professional/list_all_professionals", {
          fromOnlineScheduling: somente_agendamento_online ? true : undefined,
        }),
      ),
  );

  server.registerTool(
    "clinicorp_listar_procedimentos",
    {
      title: "Listar procedimentos",
      description:
        "Lista os procedimentos cadastrados na Clinicorp. Use os nomes exatamente como aparecem aqui ao montar um agendamento.",
      annotations: READ_ONLY,
    },
    () => run(() => client.get("/procedures/list")),
  );

  server.registerTool(
    "clinicorp_horarios_disponiveis",
    {
      title: "Horários disponíveis",
      description:
        "Mostra os horários livres de um profissional numa clínica, num intervalo de datas. Consulte sempre antes de oferecer horário a um paciente.",
      inputSchema: {
        profissional_id: id.describe("ID do profissional (veja clinicorp_listar_profissionais)"),
        clinica_id: id.describe("ID da clínica (veja clinicorp_listar_clinicas)"),
        data_inicial: date,
        data_final: date,
      },
      annotations: READ_ONLY,
    },
    ({ profissional_id, clinica_id, data_inicial, data_final }) =>
      run(() =>
        client.get("/business/list_available_times", {
          professionalId: profissional_id,
          clinicId: clinica_id,
          fromDate: compactDate(data_inicial),
          toDate: compactDate(data_final),
        }),
      ),
  );

  server.registerTool(
    "clinicorp_listar_agendamentos",
    {
      title: "Listar agendamentos",
      description:
        "Lista os agendamentos de uma clínica num período (por exemplo, a agenda de hoje ou de amanhã). Pode filtrar por paciente.",
      inputSchema: {
        clinica_id: id.describe("ID da clínica (veja clinicorp_listar_clinicas)"),
        data_inicial: date,
        data_final: date,
        paciente_id: id.optional().describe("Filtra por um paciente"),
        incluir_cancelados: z.boolean().optional().describe("Inclui agendamentos cancelados"),
      },
      annotations: READ_ONLY,
    },
    ({ clinica_id, data_inicial, data_final, paciente_id, incluir_cancelados }) =>
      run(() =>
        client.get("/appointment/list", {
          subscriber_id: sid,
          from: data_inicial,
          to: data_final,
          businessId: clinica_id,
          patientId: paciente_id,
          includeCanceled: incluir_cancelados ? true : undefined,
        }),
      ),
  );

  server.registerTool(
    "clinicorp_status_de_agendamento",
    {
      title: "Status de agendamento",
      description: "Lista os status de agendamento configurados na clínica (ex.: agendado, confirmado, faltou).",
      annotations: READ_ONLY,
    },
    () => run(() => client.get("/appointment/status_list", { subscriber_id: sid })),
  );

  server.registerTool(
    "clinicorp_buscar_paciente",
    {
      title: "Buscar paciente",
      description:
        "Busca um paciente por ID, CPF, e-mail, nome ou telefone. Informe pelo menos um filtro. Os dados são pessoais e de saúde: use só para atender o pedido em andamento.",
      inputSchema: {
        paciente_id: id.optional(),
        cpf: z.string().optional(),
        email: z.string().optional(),
        nome: z.string().optional(),
        telefone: z.string().optional().describe("Telefone, de preferência só números com DDD"),
      },
      annotations: READ_ONLY,
    },
    async ({ paciente_id, cpf, email, nome, telefone }) => {
      if (!paciente_id && !cpf && !email && !nome && !telefone) {
        return errorResult(
          new ClinicorpError("Informe pelo menos um filtro: paciente_id, cpf, email, nome ou telefone."),
        );
      }
      return run(() =>
        client.get("/patient/get", {
          subscriber_id: sid,
          PatientId: paciente_id,
          OtherDocumentId: cpf,
          Email: email,
          Name: nome,
          Phone: telefone,
        }),
      );
    },
  );

  server.registerTool(
    "clinicorp_agendamentos_do_paciente",
    {
      title: "Agendamentos do paciente",
      description: "Lista o histórico de agendamentos de um paciente.",
      inputSchema: { paciente_id: id },
      annotations: READ_ONLY,
    },
    ({ paciente_id }) => run(() => client.get("/patient/list_appointments", { PatientId: paciente_id })),
  );

  server.registerTool(
    "clinicorp_listar_orcamentos",
    {
      title: "Listar orçamentos",
      description:
        "Lista os orçamentos (planos de tratamento) criados num período, para acompanhar os que estão em aberto.",
      inputSchema: {
        data_inicial: date,
        data_final: date,
        clinica_id: id.optional(),
      },
      annotations: READ_ONLY,
    },
    ({ data_inicial, data_final, clinica_id }) =>
      run(() =>
        client.get("/estimates/list", {
          subscriber_id: sid,
          from: data_inicial,
          to: data_final,
          clinic_id: clinica_id,
        }),
      ),
  );

  server.registerTool(
    "clinicorp_ver_orcamento",
    {
      title: "Ver orçamento",
      description: "Mostra os detalhes de um orçamento pelo ID do tratamento (veja clinicorp_listar_orcamentos).",
      inputSchema: { tratamento_id: id },
      annotations: READ_ONLY,
    },
    ({ tratamento_id }) =>
      run(() => client.get("/estimates/get", { subscriber_id: sid, treatment_id: tratamento_id })),
  );

  server.registerTool(
    "clinicorp_listar_pagamentos",
    {
      title: "Listar pagamentos",
      description:
        "Lista pagamentos e parcelas num período, para a Cobrança e a página da manhã. Só leitura: o conector nunca dá baixa nem altera valores.",
      inputSchema: {
        data_inicial: date,
        data_final: date,
        tipo_de_data: z
          .string()
          .optional()
          .describe("Qual data filtrar, conforme a Clinicorp (ex.: vencimento ou pagamento)"),
        incluir_total: z.boolean().optional().describe("Inclui o valor total do período"),
      },
      annotations: READ_ONLY,
    },
    ({ data_inicial, data_final, tipo_de_data, incluir_total }) =>
      run(() =>
        client.get("/payment/list", {
          subscriber_id: sid,
          from: data_inicial,
          to: data_final,
          date_type: tipo_de_data,
          include_total_amount: incluir_total ? "X" : undefined,
        }),
      ),
  );

  server.registerTool(
    "clinicorp_resumo_financeiro",
    {
      title: "Resumo financeiro",
      description: "Resumo financeiro de um período (entradas e saídas), opcionalmente de uma clínica.",
      inputSchema: {
        data_inicial: date,
        data_final: date,
        clinica_id: id.optional(),
      },
      annotations: READ_ONLY,
    },
    ({ data_inicial, data_final, clinica_id }) =>
      run(() =>
        client.get("/financial/list_summary", {
          subscriber_id: sid,
          from: data_inicial,
          to: data_final,
          business_id: clinica_id,
        }),
      ),
  );

  // ---------------------------------------------------------------- Gravação
  // Cada ferramenta só existe se a ação estiver liberada na configuração.

  if (config.writes.has("criar_agendamento")) {
    server.registerTool(
      "clinicorp_criar_agendamento",
      {
        title: "Criar agendamento",
        description:
          "Cria um agendamento na agenda da Clinicorp. Antes, confira o horário livre com clinicorp_horarios_disponiveis." +
          WRITE_NOTE,
        inputSchema: {
          nome_paciente: z.string().min(1),
          data: date,
          hora_inicio: time,
          hora_fim: time,
          clinica_id: id,
          profissional_id: id,
          paciente_id: id.optional().describe("ID do paciente, se já tiver cadastro"),
          celular: z.string().optional(),
          email: z.string().optional(),
          procedimentos: z
            .array(z.string().min(1))
            .optional()
            .describe("Nomes dos procedimentos, como em clinicorp_listar_procedimentos"),
          descricao: z.string().optional().describe("Tipo de sessão, sem detalhes clínicos"),
        },
        annotations: WRITE,
      },
      (input) => {
        if (input.hora_fim <= input.hora_inicio) {
          return errorResult(new ClinicorpError("hora_fim precisa ser depois de hora_inicio."));
        }
        if (input.procedimentos?.some((p) => p.includes(","))) {
          return errorResult(
            new ClinicorpError("Nome de procedimento com vírgula não é aceito pela Clinicorp."),
          );
        }
        const body: Record<string, unknown> = {
          PatientName: input.nome_paciente,
          date: input.data,
          fromTime: input.hora_inicio,
          toTime: input.hora_fim,
          Clinic_BusinessId: input.clinica_id,
          Dentist_PersonId: input.profissional_id,
        };
        if (input.paciente_id) body.Patient_PersonId = input.paciente_id;
        if (input.celular) body.MobilePhone = input.celular;
        if (input.email) body.Email = input.email;
        if (input.procedimentos?.length) body.Procedures = input.procedimentos.join(",");
        if (input.descricao) body.CategoryDescription = input.descricao;
        return runWrite("criar_agendamento", input, () =>
          client.post("/appointment/create_appointment_by_api", body),
        );
      },
    );
  }

  if (config.writes.has("confirmar_agendamento")) {
    server.registerTool(
      "clinicorp_confirmar_agendamento",
      {
        title: "Confirmar agendamento",
        description:
          "Marca um agendamento como confirmado, depois que o paciente confirmou presença." + WRITE_NOTE,
        inputSchema: { agendamento_id: id },
        annotations: { ...WRITE, idempotentHint: true },
      },
      (input) =>
        runWrite("confirmar_agendamento", input, () =>
          client.post("/appointment/confirm_appointment", {
            subscriber_id: sid,
            id: input.agendamento_id,
          }),
        ),
    );
  }

  if (config.writes.has("criar_paciente")) {
    server.registerTool(
      "clinicorp_criar_paciente",
      {
        title: "Criar paciente",
        description:
          "Cadastra um paciente novo. Antes, procure com clinicorp_buscar_paciente para não duplicar." +
          WRITE_NOTE,
        inputSchema: {
          nome: z.string().min(1),
          celular: z.string().optional(),
          email: z.string().optional(),
          cpf: z.string().optional(),
          data_nascimento: date.optional(),
        },
        annotations: WRITE,
      },
      (input) => {
        const body: Record<string, unknown> = { subscriber_id: sid, Name: input.nome };
        if (input.celular) body.MobilePhone = input.celular;
        if (input.email) body.Email = input.email;
        if (input.cpf) body.OtherDocumentId = input.cpf;
        if (input.data_nascimento) body.BirthDate = input.data_nascimento;
        return runWrite("criar_paciente", input, () => client.post("/patient/create", body));
      },
    );
  }

  if (config.writes.has("adicionar_lead")) {
    server.registerTool(
      "clinicorp_adicionar_lead",
      {
        title: "Adicionar lead no CRM",
        description:
          "Cria um contato (lead) no CRM da Clinicorp, por exemplo alguém que pediu informação pelo WhatsApp." +
          WRITE_NOTE,
        inputSchema: {
          nome: z.string().min(1),
          telefone: z.string().optional(),
          email: z.string().optional(),
          quadro: z.string().optional().describe("Nome do quadro (funil) do CRM"),
          observacoes: z.string().optional().describe("Sem informação clínica"),
        },
        annotations: WRITE,
      },
      (input) => {
        const body: Record<string, unknown> = { subscriber_id: sid, Name: input.nome };
        if (input.telefone) body.Phone = input.telefone;
        if (input.email) body.Email = input.email;
        if (input.quadro) body.BoardName = input.quadro;
        if (input.observacoes) body.Notes = input.observacoes;
        return runWrite("adicionar_lead", input, () => client.post("/crm/add_leads", body));
      },
    );
  }
}

async function logWrite(
  path: string | undefined,
  action: WriteAction,
  input: Record<string, unknown>,
  status: "ok" | "erro",
  err?: unknown,
): Promise<void> {
  if (!path) return;
  const line = {
    quando: new Date().toISOString(),
    acao: action,
    status,
    entrada: input,
    ...(err ? { erro: err instanceof Error ? err.message : String(err) } : {}),
  };
  try {
    await appendFile(path, JSON.stringify(line) + "\n", "utf8");
  } catch (e) {
    console.error(`[clinicorp-mcp] Não consegui gravar o registro em ${path}:`, e);
  }
}
