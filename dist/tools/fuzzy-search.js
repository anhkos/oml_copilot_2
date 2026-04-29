export function createFuzzySearchToolHandler(restClient) {
    return async ({ query, limit }) => {
        const body = { query };
        if (limit !== undefined)
            body.limit = limit;
        const result = await restClient.fuzzySearch(body);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
