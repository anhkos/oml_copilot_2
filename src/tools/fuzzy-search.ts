import type { OmlRestClient } from "../oml/rest.js";

type FuzzySearchArgs = {
  text: string;
  limit?: number;
};

export function createFuzzySearchToolHandler(restClient: OmlRestClient) {
  return async ({ text, limit }: FuzzySearchArgs) => {
    const result = await restClient.fuzzySearch(text, limit);
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
  };
}
