import { z } from "zod";
export const getAssertionsSchema = {
    modelUri: z
        .string()
        .optional()
        .describe("File URI of a single OML model to scope the output to (from list_models). Omit to dump the full workspace."),
    format: z
        .enum(["ttl", "trig", "nt", "nq", "n3"])
        .optional()
        .describe("RDF serialization format (default: ttl)"),
    pretty: z
        .boolean()
        .optional()
        .describe("Pretty-print the output (default: false)"),
};
export function createGetAssertionsToolHandler(restClient) {
    return async ({ modelUri, format, pretty }) => {
        const result = await restClient.assertions(modelUri, format, pretty);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
