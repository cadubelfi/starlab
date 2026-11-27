#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfigError, loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`[clinicorp-mcp] ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const server = createServer(config);
  await server.connect(new StdioServerTransport());

  const writes = [...config.writes];
  console.error(
    `[clinicorp-mcp] Conectado. Gravações liberadas: ${writes.length ? writes.join(", ") : "nenhuma (só leitura)"}.`,
  );
}

main().catch((err) => {
  console.error("[clinicorp-mcp] Erro fatal:", err);
  process.exit(1);
});
