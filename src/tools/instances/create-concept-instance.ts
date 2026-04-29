import { z } from "zod";
import type { OmlRestClient } from "../../oml/rest.js";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";
import { propertyValueSchema, type PropertyValue } from "./types.js";

export const createConceptInstanceSchema = {
  ontologyIri: z.string().describe("IRI of the description ontology to create the instance in"),
  instanceName: z.string().describe("Local name for the new instance, e.g. 'MissionCommander'"),
  types: z
    .array(z.string())
    .optional()
    .describe("IRIs of concept types to assert on the instance (use fuzzy_search to look these up)"),
  propertyValues: z
    .array(propertyValueSchema)
    .optional()
    .describe("Property assertions to add to the instance"),
  annotations: z
    .array(propertyValueSchema)
    .optional()
    .describe("Annotation assertions to add to the instance"),
  referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};

type CreateConceptInstanceArgs = {
  ontologyIri: string;
  instanceName: string;
  types?: string[];
  propertyValues?: PropertyValue[];
  annotations?: PropertyValue[];
  referencingUri?: string;
};

export function createConceptInstanceToolHandler(restClient: OmlRestClient) {
  return async ({ ontologyIri, instanceName, types, propertyValues, annotations, referencingUri }: CreateConceptInstanceArgs) => {
    const instanceIri = `${ontologyIri}#${instanceName}`;
    const ops: unknown[] = [
      { kind: "createInstance", ontologyIri, instanceName },
      ...(types ?? []).map((typeIri) => ({ kind: "createInstanceRef", ontologyIri, instanceIri, typeIri })),
      ...(propertyValues ?? []).map(({ predicateIri, object }) => ({
        kind: "addAssertion", ontologyIri, subjectIri: instanceIri, predicateIri, object,
      })),
      ...(annotations ?? []).map(({ predicateIri, object }) => ({
        kind: "addAnnotation", ontologyIri, subjectIri: instanceIri, predicateIri, object,
      })),
    ];

    const result = await restClient.update(ops, referencingUri);
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }

    const applied = await applyWorkspaceEdit(result.data);
    if (!applied.ok) {
      return { content: [{ type: "text" as const, text: `Error applying workspace edit: ${applied.error}` }], isError: true };
    }

    const summary = applied.filesChanged.length > 0
      ? `Created instance ${instanceName}. Modified files:\n${applied.filesChanged.join("\n")}`
      : `Created instance ${instanceName} (no file changes returned).`;
    return { content: [{ type: "text" as const, text: summary }] };
  };
}
