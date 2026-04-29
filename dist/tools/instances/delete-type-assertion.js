import { z } from "zod";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";
export const deleteTypeAssertionSchema = {
    ontologyIri: z.string().describe("IRI of the ontology that owns the instance"),
    memberIri: z.string().describe("IRI of the instance to remove the type from"),
    typeIri: z.string().optional().describe("IRI of the type to remove"),
    referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};
export function createDeleteTypeAssertionToolHandler(restClient) {
    return async ({ ontologyIri, memberIri, typeIri, referencingUri }) => {
        const op = { kind: "deleteMemberRef", ontologyIri, memberIri };
        if (typeIri)
            op.typeIri = typeIri;
        const result = await restClient.update([op], referencingUri);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        const applied = await applyWorkspaceEdit(result.data);
        if (!applied.ok) {
            return { content: [{ type: "text", text: `Error applying workspace edit: ${applied.error}` }], isError: true };
        }
        const summary = applied.filesChanged.length > 0
            ? `Removed type assertion. Modified files:\n${applied.filesChanged.join("\n")}`
            : `Remove accepted (no file changes returned).`;
        return { content: [{ type: "text", text: summary }] };
    };
}
