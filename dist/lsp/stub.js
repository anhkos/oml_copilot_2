export class StubLSPClient {
    async initialize(_workspaceRoot) {
        return;
    }
    async getDiagnostics(_uri) {
        return [];
    }
    async shutdown() {
        return;
    }
}
