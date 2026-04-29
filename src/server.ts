import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { OmlRestClient } from "./oml/rest.js";
import type { StartupStatus } from "./oml/startup.js";
import { createDescribeServerToolHandler } from "./tools/describe.js";
import { createFuzzySearchToolHandler } from "./tools/fuzzy-search.js";
import { createConceptInstanceToolHandler, createConceptInstanceSchema } from "./tools/instances/create-concept-instance.js";
import { createRelationInstanceToolHandler, createRelationInstanceSchema } from "./tools/instances/create-relation-instance.js";
import { createDeleteInstanceToolHandler, deleteInstanceSchema } from "./tools/instances/delete-instance.js";
import { createDeletePropertyValueToolHandler, deletePropertyValueSchema } from "./tools/instances/delete-property-value.js";
import { createDeleteTypeAssertionToolHandler, deleteTypeAssertionSchema } from "./tools/instances/delete-type-assertion.js";
import { createGetAssertionsToolHandler, getAssertionsSchema } from "./tools/instances/get-assertions.js";
import { createUpdatePropertyValueToolHandler, updatePropertyValueSchema } from "./tools/instances/update-property-value.js";
import { createLintToolHandler } from "./tools/lint.js";
import { createListModelsToolHandler } from "./tools/list-models.js";
import { createValidateToolHandler } from "./tools/validate.js";

export function createServer(restClient: OmlRestClient, startupStatus: StartupStatus): McpServer {
  const server = new McpServer({
    name: "oml-copilot-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "describe_server",
    {
      description: "Returns a summary of server capabilities, available tools, and startup diagnostics for the OML workspace and REST server.",
      inputSchema: {},
    },
    createDescribeServerToolHandler(startupStatus),
  );

  server.registerTool(
    "list_models",
    {
      description: "Lists all OML model files in the workspace. Returns each file's workspace-relative path and its absolute file URI. Use the URI when other tools ask for a modelUri or referencingUri.",
      inputSchema: {},
    },
    createListModelsToolHandler(restClient),
  );

  server.registerTool(
    "fuzzy_search",
    {
      description: "Searches for OML members (instances, concepts, properties) by fuzzy text match. Returns IRIs ranked by score (0–1). Use this to look up IRIs before calling tools that require them.",
      inputSchema: {
        text: z.string().describe("Text to search for, e.g. 'AI Warden' or 'MissionCommander'"),
        limit: z.number().int().min(1).max(50).optional().describe("Max results to return (1–50, default 12)"),
      },
    },
    createFuzzySearchToolHandler(restClient),
  );

  server.registerTool(
    "get_assertions",
    {
      description:
        "Returns the RDF assertions for OML models serialized as Turtle (or another RDF format). " +
        "Pass a modelUri (from list_models) to scope to one file, or omit it to get the full workspace. " +
        "Use this to read an instance's current property values before updating or deleting.",
      inputSchema: getAssertionsSchema,
    },
    createGetAssertionsToolHandler(restClient),
  );

  server.registerTool(
    "create_concept_instance",
    {
      description:
        "Creates a new concept instance in a description ontology. " +
        "Use fuzzy_search to look up type IRIs and list_models to get the referencingUri.",
      inputSchema: createConceptInstanceSchema,
    },
    createConceptInstanceToolHandler(restClient),
  );

  server.registerTool(
    "create_relation_instance",
    {
      description:
        "Creates a new relation instance linking source and target instances. " +
        "Pass sources and targets as propertyValues with the appropriate predicate IRIs.",
      inputSchema: createRelationInstanceSchema,
    },
    createRelationInstanceToolHandler(restClient),
  );

  server.registerTool(
    "delete_instance",
    {
      description:
        "Deletes an OML instance and all of its references (cascade). Use fuzzy_search to find the memberIri first.",
      inputSchema: deleteInstanceSchema,
    },
    createDeleteInstanceToolHandler(restClient),
  );

  server.registerTool(
    "delete_type_assertion",
    {
      description: "Removes a type assertion from an OML instance (deleteMemberRef).",
      inputSchema: deleteTypeAssertionSchema,
    },
    createDeleteTypeAssertionToolHandler(restClient),
  );

  server.registerTool(
    "delete_property_value",
    {
      description:
        "Removes all assertions for a given property on an OML instance. Use get_assertions to confirm the current value first.",
      inputSchema: deletePropertyValueSchema,
    },
    createDeletePropertyValueToolHandler(restClient),
  );

  server.registerTool(
    "update_property_value",
    {
      description:
        "Updates an existing property assertion on an OML instance. Use get_assertions to read the current value first.",
      inputSchema: updatePropertyValueSchema,
    },
    createUpdatePropertyValueToolHandler(restClient),
  );

  server.registerTool(
    "lint_model",
    {
      description: "Lints all OML models in the workspace and returns diagnostics (errors, warnings).",
      inputSchema: {},
    },
    createLintToolHandler(restClient),
  );

  server.registerTool(
    "validate_model",
    {
      description: "Validates all OML models in the workspace and returns validation results.",
      inputSchema: {},
    },
    createValidateToolHandler(restClient),
  );

  return server;
}
