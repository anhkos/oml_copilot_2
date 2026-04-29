export function createExportToolHandler(restClient) {
    return async ({ format, path }) => {
        const body = { format };
        if (path)
            body.path = path;
        const result = await restClient.export(body);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
