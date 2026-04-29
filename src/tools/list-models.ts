import type { OmlRestClient } from "../oml/rest.js";

export function createListModelsToolHandler(restClient: OmlRestClient) {
  return async () => {
    const result = await restClient.listModels();
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
  };
}
