import type { StartupStatus } from "../oml/startup.js";

export function createDescribeServerToolHandler(startupStatus: StartupStatus) {
  return async () => {
    const checks = startupStatus.checks.map(
      (check) => `  - [${check.level.toUpperCase()}] ${check.name}: ${check.message}`,
    );

    return {
      content: [
        {
          type: "text" as const,
          text: [
            "This is an MCP server that connects AI assistants to an OML (Ontological Modeling Language) workspace",
            "via the OML REST server launched by `oml start`.",
            "",
            "Available tools:",
            "  - describe_server: Returns this description and startup diagnostics.",
            "  - lint_model: Lints all OML models in the workspace; returns diagnostics (errors, warnings).",
            "  - validate_model: Validates all OML models in the workspace; returns validation results.",
            "",
            "Startup diagnostics:",
            `  workspaceRoot : ${startupStatus.workspaceRoot}`,
            `  restBaseUrl   : ${startupStatus.restBaseUrl}`,
            `  strictMode    : ${String(startupStatus.strictMode)}`,
            ...checks,
          ].join("\n"),
        },
      ],
    };
  };
}
