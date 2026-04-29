export function createDescribeServerToolHandler(startupStatus) {
    return async () => {
        const checks = startupStatus.checks.map((check) => `  - [${check.level.toUpperCase()}] ${check.name}: ${check.message}`);
        return {
            content: [
                {
                    type: "text",
                    text: [
                        "This is an MCP server that connects AI assistants to an OML (Ontological Modeling Language) workspace",
                        "via the OML REST server launched by `oml start`.",
                        "",
                        "Available tools:",
                        "  - describe_server: Returns this description and startup diagnostics.",
                        "  - list_models: Lists all OML files in the workspace with their paths and file URIs.",
                        "  - fuzzy_search: Searches for OML members by name; returns IRIs ranked by score. Use this to look up IRIs before calling tools that require them.",
                        "  - get_assertions: Returns RDF assertions for one model (pass modelUri) or the full workspace. Use this to read an instance's current state before updating or deleting.",
                        "  - create_concept_instance: Creates a new concept instance with optional types and property values.",
                        "  - create_relation_instance: Creates a new relation instance with optional types and link assertions.",
                        "  - delete_instance: Deletes an instance and all its references (cascade). Requires memberIri.",
                        "  - delete_type_assertion: Removes a type assertion from an instance. Requires memberIri, optional typeIri.",
                        "  - delete_property_value: Removes all values for a property on an instance. Requires subjectIri and predicateIri.",
                        "  - update_property_value: Updates an existing property assertion on an instance. Requires subjectIri, predicateIri, and new object value.",
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
