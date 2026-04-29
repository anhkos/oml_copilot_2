#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { OmlRestClient } from "./oml/rest.js";
import { buildStartupStatus, formatStartupStatus, hasStartupErrors } from "./oml/startup.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const workspaceRoot = process.env.OML_WORKSPACE_ROOT ?? process.cwd();
  const startupStatus = await buildStartupStatus(workspaceRoot);

  for (const line of formatStartupStatus(startupStatus)) {
    process.stderr.write(`[startup] ${line}\n`);
  }

  if (startupStatus.strictMode && hasStartupErrors(startupStatus)) {
    throw new Error(
      "Startup validation failed. Set OML_WORKSPACE_STRICT=false to continue in non-strict mode.",
    );
  }

  const restClient = new OmlRestClient(startupStatus.restBaseUrl);
  const server = createServer(restClient, startupStatus);
  const transport = new StdioServerTransport();

  process.once("SIGINT", () => {
    void server.close().finally(() => process.exit(0));
  });

  process.once("SIGTERM", () => {
    void server.close().finally(() => process.exit(0));
  });

  await server.connect(transport);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
