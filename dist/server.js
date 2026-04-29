import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDescribeServerToolHandler } from "./tools/describe.js";
import { createLintToolHandler } from "./tools/lint.js";
import { createValidateToolHandler } from "./tools/validate.js";
export function createServer(restClient, startupStatus) {
    const server = new McpServer({
        name: "oml-copilot-mcp",
        version: "0.1.0",
    });
    server.registerTool("describe_server", {
        description: "Returns a summary of server capabilities, available tools, and startup diagnostics for the OML workspace and REST server.",
        inputSchema: {},
    }, createDescribeServerToolHandler(startupStatus));
    server.registerTool("lint_model", {
        description: "Lints all OML models in the workspace and returns diagnostics (errors, warnings).",
        inputSchema: {},
    }, createLintToolHandler(restClient));
    server.registerTool("validate_model", {
        description: "Validates all OML models in the workspace and returns validation results.",
        inputSchema: {},
    }, createValidateToolHandler(restClient));
    return server;
}
