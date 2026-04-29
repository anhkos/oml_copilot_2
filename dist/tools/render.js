export function createRenderToolHandler(restClient) {
    return async ({ path, format }) => {
        const body = { path };
        if (format)
            body.format = format;
        const result = await restClient.render(body);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
