export function createLintToolHandler(restClient) {
    return async () => {
        const result = await restClient.lint();
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
