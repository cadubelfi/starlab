import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ClinicorpClient } from "./client.js";
import type { Config } from "./config.js";
import { registerTools } from "./tools.js";

export const SERVER_VERSION = "0.1.0";

export function createServer(config: Config, fetchImpl: typeof fetch = fetch): McpServer {
  const server = new McpServer(
    { name: "clinicorp", version: SERVER_VERSION },
    {
      instructions:
        "Conector da Clinicorp (sistema de gestão da clínica odontológica). " +
        "Consulte a Clinicorp antes de responder sobre agenda, pacientes, orçamentos ou pagamentos; não responda de memória. " +
        "Ferramentas que gravam só devem ser usadas com o OK explícito do dentista. " +
        "Os dados são pessoais e de saúde (LGPD): use só o necessário para o pedido em andamento e nunca os envie a terceiros. " +
        "Datas no formato AAAA-MM-DD.",
    },
  );
  registerTools(server, new ClinicorpClient(config, fetchImpl), config);
  return server;
}
