import { z } from "zod";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";
const richObject = z.object({
    value: z.string(),
    langTag: z.string().optional(),
    datatypeIri: z.string().optional(),
    typeIri: z.string().optional(),
});
export const updatePropertyValueSchema = {
    ontologyIri: z.string().describe("IRI of the ontology that owns the instance"),
    subjectIri: z.string().describe("IRI of the instance to update"),
    predicateIri: z.string().describe("IRI of the property to update"),
    object: z
        .union([z.string(), z.number(), z.boolean(), richObject])
        .describe("New value — a plain string/number/boolean, or { value, langTag?, datatypeIri?, typeIri? }"),
    referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};
export function createUpdatePropertyValueToolHandler(restClient) {
    return async ({ ontologyIri, subjectIri, predicateIri, object, referencingUri }) => {
        const result = await restClient.update([{ kind: "updateAssertion", ontologyIri, subjectIri, predicateIri, object }], referencingUri);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        const applied = await applyWorkspaceEdit(result.data);
        if (!applied.ok) {
            return { content: [{ type: "text", text: `Error applying workspace edit: ${applied.error}` }], isError: true };
        }
        const summary = applied.filesChanged.length > 0
            ? `Updated property value. Modified files:\n${applied.filesChanged.join("\n")}`
            : `Update accepted (no file changes returned).`;
        return { content: [{ type: "text", text: summary }] };
    };
}
