export function createDiagnosticsToolHandler(lspClient) {
    return async ({ uri }) => {
        const diagnostics = await lspClient.getDiagnostics(uri);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(diagnostics),
                },
            ],
        };
    };
}
