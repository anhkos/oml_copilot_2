import { createHash } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "out", ".oml-cache"]);
export async function buildStartupStatus(workspaceRootInput) {
    const workspaceRoot = path.resolve(workspaceRootInput);
    const strictMode = parseBoolean(process.env.OML_WORKSPACE_STRICT, true);
    const checks = [];
    // Primary workspace signal: .oml/ directory
    const hasOmlDir = await fileExists(path.join(workspaceRoot, ".oml"));
    checks.push({
        name: "workspace.omlDir",
        level: hasOmlDir ? "ok" : (strictMode ? "error" : "warning"),
        message: hasOmlDir
            ? `Found .oml directory at ${workspaceRoot}.`
            : `No .oml directory found at ${workspaceRoot}. Is this an OML workspace?`,
    });
    const hasOmlYml = await fileExists(path.join(workspaceRoot, "oml.yml"));
    checks.push({
        name: "workspace.omlYml",
        level: hasOmlYml ? "ok" : "warning",
        message: hasOmlYml
            ? `Found oml.yml at ${workspaceRoot}.`
            : `Missing oml.yml at ${workspaceRoot} (optional).`,
    });
    const hasCatalogXml = await fileExists(path.join(workspaceRoot, "catalog.xml"));
    checks.push({
        name: "workspace.catalogXml",
        level: hasCatalogXml ? "ok" : "warning",
        message: hasCatalogXml
            ? "Found catalog.xml."
            : "catalog.xml not found (optional, but common in OML projects).",
    });
    const firstOmlFile = await findFirstOmlFile(workspaceRoot);
    checks.push({
        name: "workspace.omlFiles",
        level: firstOmlFile ? "ok" : "warning",
        message: firstOmlFile
            ? `Found OML file: ${firstOmlFile}.`
            : "No .oml files were discovered under the workspace root.",
    });
    // Resolve REST base URL: env override → lock file → fallback
    const restBaseUrl = await resolveRestBaseUrl(workspaceRoot, checks, strictMode);
    const restChecks = await probeRest(workspaceRoot, restBaseUrl, strictMode);
    checks.push(...restChecks);
    return { workspaceRoot, restBaseUrl, strictMode, checks };
}
async function resolveRestBaseUrl(workspaceRoot, checks, strictMode) {
    const envUrl = process.env.OML_SERVER_BASE_URL;
    if (envUrl && envUrl.trim().length > 0) {
        return envUrl.trim().replace(/\/+$/, "");
    }
    const lockPath = lockFileForWorkspace(workspaceRoot);
    let raw;
    try {
        raw = await readFile(lockPath, "utf-8");
    }
    catch {
        checks.push({
            name: "server.lockFile",
            level: strictMode ? "error" : "warning",
            message: `No server lock file found at ${lockPath}. Is the OML server running? (oml start)`,
        });
        return "http://127.0.0.1:8080";
    }
    let lock;
    try {
        lock = JSON.parse(raw);
    }
    catch {
        checks.push({
            name: "server.lockFile",
            level: "error",
            message: `Malformed server lock file at ${lockPath}.`,
        });
        return "http://127.0.0.1:8080";
    }
    if (typeof lock.port !== "number" || !Number.isFinite(lock.port)) {
        checks.push({
            name: "server.lockFile",
            level: "error",
            message: `Server lock file at ${lockPath} does not contain a valid port number.`,
        });
        return "http://127.0.0.1:8080";
    }
    const lockWorkspaceMatches = lock.workspaceRoot ? samePath(lock.workspaceRoot, workspaceRoot) : true;
    checks.push({
        name: "server.lockFile",
        level: lockWorkspaceMatches ? "ok" : (strictMode ? "error" : "warning"),
        message: lockWorkspaceMatches
            ? `Found server lock file (port ${lock.port}, pid ${lock.pid ?? "?"}).`
            : `Server lock file is for a different workspace. Lock=${lock.workspaceRoot ?? "unknown"}, expected=${workspaceRoot}.`,
    });
    return `http://127.0.0.1:${lock.port}`;
}
function lockFileForWorkspace(workspaceRoot) {
    const canonical = canonicalPath(workspaceRoot);
    const hash = createHash("sha256").update(canonical).digest("hex");
    return path.join(os.homedir(), ".oml", "workspaces", hash, "server.lock");
}
// VS Code on Windows preserves the drive letter case from path.resolve() (uppercase).
function canonicalPath(p) {
    return path.resolve(p);
}
export function formatStartupStatus(status) {
    const lines = [];
    lines.push(`Workspace root: ${status.workspaceRoot}`);
    lines.push(`REST base URL: ${status.restBaseUrl}`);
    lines.push(`Strict mode: ${String(status.strictMode)}`);
    for (const check of status.checks) {
        lines.push(`[${check.level.toUpperCase()}] ${check.name}: ${check.message}`);
    }
    return lines;
}
export function hasStartupErrors(status) {
    return status.checks.some((check) => check.level === "error");
}
async function probeRest(workspaceRoot, restBaseUrl, strictMode) {
    const checks = [];
    const healthUrl = `${restBaseUrl}/health`;
    const healthResponse = await fetchJson(healthUrl);
    if (!healthResponse.ok) {
        checks.push({
            name: "rest.health",
            level: strictMode ? "error" : "warning",
            message: `Could not call ${healthUrl}: ${healthResponse.message}`,
        });
        return checks;
    }
    checks.push({
        name: "rest.health",
        level: "ok",
        message: `Connected to ${healthUrl}.`,
    });
    const healthWorkspaceRoot = readStringField(healthResponse.data, "workspaceRoot");
    if (healthWorkspaceRoot) {
        const matches = samePath(healthWorkspaceRoot, workspaceRoot);
        checks.push({
            name: "rest.workspaceRoot",
            level: matches ? "ok" : (strictMode ? "error" : "warning"),
            message: matches
                ? `REST workspace root matches (${healthWorkspaceRoot}).`
                : `REST workspace root differs. REST=${healthWorkspaceRoot}, expected=${workspaceRoot}.`,
        });
    }
    else {
        checks.push({
            name: "rest.workspaceRoot",
            level: "warning",
            message: "Health response did not include workspaceRoot, skipping workspace-root match.",
        });
    }
    const modelsUrl = `${restBaseUrl}/v0/models`;
    const modelsResponse = await fetchJson(modelsUrl);
    if (!modelsResponse.ok) {
        checks.push({
            name: "rest.models",
            level: strictMode ? "error" : "warning",
            message: `Could not call ${modelsUrl}: ${modelsResponse.message}`,
        });
        return checks;
    }
    const files = readFilesArray(modelsResponse.data);
    if (!files) {
        checks.push({
            name: "rest.models",
            level: "warning",
            message: "Could not parse /v0/models response payload.",
        });
        return checks;
    }
    if (files.length === 0) {
        checks.push({
            name: "rest.models",
            level: "warning",
            message: "/v0/models returned zero model files.",
        });
        return checks;
    }
    const localMatches = await countLocalModelMatches(workspaceRoot, files.map((file) => file.path));
    checks.push({
        name: "rest.models",
        level: localMatches > 0 ? "ok" : (strictMode ? "error" : "warning"),
        message: localMatches > 0
            ? `/v0/models returned ${files.length} model file(s); ${localMatches} path(s) matched local workspace files.`
            : `/v0/models returned ${files.length} model file(s), but none matched local workspace paths.`,
    });
    return checks;
}
async function fetchJson(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                return { ok: false, message: `${response.status} ${response.statusText}` };
            }
            const json = (await response.json());
            return { ok: true, data: json };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, message };
    }
}
async function countLocalModelMatches(workspaceRoot, relativePaths) {
    const uniquePaths = new Set(relativePaths.filter((item) => item.length > 0));
    let count = 0;
    for (const relPath of uniquePaths) {
        const absolutePath = path.join(workspaceRoot, relPath);
        if (await fileExists(absolutePath)) {
            count += 1;
        }
    }
    return count;
}
function readFilesArray(data) {
    if (!isRecord(data))
        return undefined;
    const files = data.files;
    if (!Array.isArray(files))
        return undefined;
    return files
        .map((entry) => {
        if (!isRecord(entry) || typeof entry.path !== "string")
            return undefined;
        return { path: entry.path };
    })
        .filter((entry) => entry !== undefined);
}
function readStringField(data, fieldName) {
    if (!isRecord(data))
        return undefined;
    const value = data[fieldName];
    return typeof value === "string" ? value : undefined;
}
function parseBoolean(value, defaultValue) {
    if (value === undefined)
        return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "yes")
        return true;
    if (normalized === "0" || normalized === "false" || normalized === "no")
        return false;
    return defaultValue;
}
async function findFirstOmlFile(workspaceRoot) {
    const queue = [workspaceRoot];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current)
            continue;
        const children = await readdir(current, { withFileTypes: true });
        for (const child of children) {
            const childPath = path.join(current, child.name);
            if (child.isDirectory()) {
                if (IGNORED_DIRS.has(child.name) || child.name.startsWith("."))
                    continue;
                queue.push(childPath);
                continue;
            }
            if (child.isFile() && child.name.toLowerCase().endsWith(".oml")) {
                return path.relative(workspaceRoot, childPath);
            }
        }
    }
    return undefined;
}
function samePath(left, right) {
    return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
