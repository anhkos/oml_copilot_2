import { z } from "zod";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";
import { propertyValueSchema } from "./types.js";
export const createRelationInstanceSchema = {
    ontologyIri: z.string().describe("IRI of the description ontology to create the instance in"),
    instanceName: z.string().describe("Local name for the new relation instance, e.g. 'R1_expresses_MC'"),
    types: z
        .array(z.string())
        .optional()
        .describe("IRIs of relation entity types to assert (use fuzzy_search to look these up)"),
    propertyValues: z
        .array(propertyValueSchema)
        .optional()
        .describe("Property and link assertions including source/target relations"),
    annotations: z
        .array(propertyValueSchema)
        .optional()
        .describe("Annotation assertions to add to the instance"),
    referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};
export function createRelationInstanceToolHandler(restClient) {
    return async ({ ontologyIri, instanceName, types, propertyValues, annotations, referencingUri }) => {
        const instanceIri = `${ontologyIri}#${instanceName}`;
        const ops = [
            { kind: "createRelationInstance", ontologyIri, instanceName },
            ...(types ?? []).map((typeIri) => ({ kind: "createRelationInstanceRef", ontologyIri, instanceIri, typeIri })),
            ...(propertyValues ?? []).map(({ predicateIri, object }) => ({
                kind: "addAssertion", ontologyIri, subjectIri: instanceIri, predicateIri, object,
            })),
            ...(annotations ?? []).map(({ predicateIri, object }) => ({
                kind: "addAnnotation", ontologyIri, subjectIri: instanceIri, predicateIri, object,
            })),
        ];
        const result = await restClient.update(ops, referencingUri);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        const applied = await applyWorkspaceEdit(result.data);
        if (!applied.ok) {
            return { content: [{ type: "text", text: `Error applying workspace edit: ${applied.error}` }], isError: true };
        }
        const summary = applied.filesChanged.length > 0
            ? `Created relation instance ${instanceName}. Modified files:\n${applied.filesChanged.join("\n")}`
            : `Created relation instance ${instanceName} (no file changes returned).`;
        return { content: [{ type: "text", text: summary }] };
    };
}
