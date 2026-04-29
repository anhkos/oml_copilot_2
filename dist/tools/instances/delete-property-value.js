import { z } from "zod";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";
export const deletePropertyValueSchema = {
    ontologyIri: z.string().describe("IRI of the ontology that owns the instance"),
    subjectIri: z.string().describe("IRI of the instance whose property value is being removed"),
    predicateIri: z.string().describe("IRI of the property to remove (removes all values for this property)"),
    referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};
export function createDeletePropertyValueToolHandler(restClient) {
    return async ({ ontologyIri, subjectIri, predicateIri, referencingUri }) => {
        const result = await restClient.update([{ kind: "removeAssertion", ontologyIri, subjectIri, predicateIri }], referencingUri);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        const applied = await applyWorkspaceEdit(result.data);
        if (!applied.ok) {
            return { content: [{ type: "text", text: `Error applying workspace edit: ${applied.error}` }], isError: true };
        }
        const summary = applied.filesChanged.length > 0
            ? `Removed property value. Modified files:\n${applied.filesChanged.join("\n")}`
            : `Remove accepted (no file changes returned).`;
        return { content: [{ type: "text", text: summary }] };
    };
}
