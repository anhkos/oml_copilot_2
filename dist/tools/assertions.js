export function createAssertionsToolHandler(restClient) {
    return async ({ path }) => {
        const params = path ? { path } : undefined;
        const result = await restClient.assertions(params);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
