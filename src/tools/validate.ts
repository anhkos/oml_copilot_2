import type { OmlRestClient } from "../oml/rest.js";

export function createValidateToolHandler(restClient: OmlRestClient) {
  return async () => {
    const result = await restClient.validate();
    if (!result.ok) {
      return { content: [{ type: "text" as const, text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
  };
}
