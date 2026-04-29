# oml-copilot-mcp

An MCP server that connects AI assistants to an [OML (Ontological Modeling Language)](https://www.opencaesar.io/oml/) workspace via the REST API exposed by `oml start`. It lets Claude Code, GitHub Copilot, and other MCP clients call OML operations directly from chat.

## Prerequisites

- [OML VS Code extension](https://github.com/opencaesar/oml-vision) installed
- `oml start` running in your OML workspace (starts the REST server and writes a lock file the MCP server reads to auto-discover the port)

## Tools

| Tool | Description |
|---|---|
| `describe_server` | Returns server capabilities and startup diagnostics. Call this first to verify connectivity. |
| `lint_model` | Lints all OML models in the workspace and returns diagnostics (errors, warnings). |
| `validate_model` | Validates all OML models in the workspace and returns validation results. |

## Build

```bash
npm install
npm run build
```

Compiles TypeScript to `dist/`. The entry point is `dist/index.js`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OML_WORKSPACE_ROOT` | `cwd` | Workspace to validate and connect to |
| `OML_SERVER_BASE_URL` | auto-discovered | REST base URL — auto-read from the OML lock file; set this to override |
| `OML_WORKSPACE_STRICT` | `true` | Set to `false` to start despite errors |

The lock file is written by the OML extension at:
`~/.oml/workspaces/<sha256-of-workspace-path>/server.lock`

---

## Setup

In all cases, place the config in your **OML workspace directory** (not the `oml-copilot-mcp` repo). The MCP server uses `cwd` as the workspace root, so it must be launched from the right directory.

### Claude Code

Create `.mcp.json` at your OML workspace root:

```json
{
  "mcpServers": {
    "oml-copilot": {
      "command": "node",
      "args": ["/absolute/path/to/oml_copilot_2/dist/index.js"]
    }
  }
}
```

Run `claude` from the workspace. Claude Code reads `.mcp.json` automatically. Verify with `/mcp` — you should see `oml-copilot · ✔ connected`.

### GitHub Copilot (VS Code)

Create `.vscode/mcp.json` in your OML workspace:

```json
{
  "servers": {
    "oml-copilot": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/oml_copilot_2/dist/index.js"]
    }
  }
}
```

Or add to VS Code user `settings.json` to enable it across all workspaces:

```json
{
  "mcp": {
    "servers": {
      "oml-copilot": {
        "type": "stdio",
        "command": "node",
        "args": ["/absolute/path/to/oml_copilot_2/dist/index.js"]
      }
    }
  }
}
```

Reload VS Code after making changes. Use **Agent mode** in Copilot Chat to call MCP tools.

### OpenAI Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.oml-copilot]
command = "node"
args = ["/absolute/path/to/oml_copilot_2/dist/index.js"]
```
