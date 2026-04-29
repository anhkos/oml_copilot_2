import { z } from "zod";
import type { OmlRestClient } from "../../oml/rest.js";

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

type GetAssertionsArgs = {
  modelUri?: string;
  format?: "ttl" | "trig" | "nt" | "nq" | "n3";
  pretty?: boolean;
};

export function createGetAssertionsToolHandler(restClient: OmlRestClient) {
  return async ({ modelUri, format, pretty }: GetAssertionsArgs) => {
    const result = await restClient.assertions(modelUri, format, pretty);
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
  };
}
