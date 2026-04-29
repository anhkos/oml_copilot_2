import { z } from "zod";
import type { OmlRestClient } from "../../oml/rest.js";
import { applyWorkspaceEdit } from "../../oml/workspace-edit.js";

export const deleteInstanceSchema = {
  ontologyIri: z.string().describe("IRI of the ontology that owns the instance"),
  memberIri: z.string().describe("IRI of the instance to delete (use fuzzy_search to look this up)"),
  referencingUri: z.string().optional().describe("File URI of the description being edited (from list_models)"),
};

type DeleteInstanceArgs = {
  ontologyIri: string;
  memberIri: string;
  referencingUri?: string;
};

export function createDeleteInstanceToolHandler(restClient: OmlRestClient) {
  return async ({ ontologyIri, memberIri, referencingUri }: DeleteInstanceArgs) => {
    const result = await restClient.update(
      [{ kind: "deleteMemberCascade", ontologyIri, memberIri }],
      referencingUri,
    );
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }

    const applied = await applyWorkspaceEdit(result.data);
    if (!applied.ok) {
      return { content: [{ type: "text" as const, text: `Error applying workspace edit: ${applied.error}` }], isError: true };
    }

    const summary = applied.filesChanged.length > 0
      ? `Deleted instance. Modified files:\n${applied.filesChanged.join("\n")}`
      : `Delete accepted (no file changes returned).`;
    return { content: [{ type: "text" as const, text: summary }] };
  };
}
