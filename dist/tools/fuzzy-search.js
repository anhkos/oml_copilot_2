export function createFuzzySearchToolHandler(restClient) {
    return async ({ text, limit }) => {
        const result = await restClient.fuzzySearch(text, limit);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
