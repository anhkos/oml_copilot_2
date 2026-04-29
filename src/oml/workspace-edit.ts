import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

type Position = { line: number; character: number };
type Range = { start: Position; end: Position };
type TextEdit = { range: Range; newText: string };

type WorkspaceEdit = {
  changes?: Record<string, TextEdit[]>;
  documentChanges?: Array<{
    textDocument: { uri: string };
    edits: TextEdit[];
  }>;
};

export type ApplyResult =
  | { ok: true; filesChanged: string[] }
  | { ok: false; error: string };

export async function applyWorkspaceEdit(data: unknown): Promise<ApplyResult> {
  const edit = parseWorkspaceEdit(data);
  if (!edit) {
    // Some operations may return {} — nothing to apply
    return { ok: true, filesChanged: [] };
  }

  const changeMap = normalizeToChangeMap(edit);
  if (changeMap.size === 0) {
    return { ok: true, filesChanged: [] };
  }

  const filesChanged: string[] = [];

  for (const [uri, edits] of changeMap) {
    let filePath: string;
    try {
      filePath = fileURLToPath(uri);
    } catch {
      return { ok: false, error: `Could not convert URI to path: ${uri}` };
    }

    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      return { ok: false, error: `Could not read file: ${filePath}` };
    }

    // Normalize CRLF → LF so character offsets are consistent
    const normalized = content.replace(/\r\n/g, "\n");
    const updated = applyTextEdits(normalized, edits);

    try {
      await writeFile(filePath, updated, "utf-8");
    } catch {
      return { ok: false, error: `Could not write file: ${filePath}` };
    }

    filesChanged.push(filePath);
  }

  return { ok: true, filesChanged };
}

function parseWorkspaceEdit(data: unknown): WorkspaceEdit | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const d = data as Record<string, unknown>;
  if (d.changes || d.documentChanges) return d as WorkspaceEdit;
  return undefined;
}

function normalizeToChangeMap(edit: WorkspaceEdit): Map<string, TextEdit[]> {
  const map = new Map<string, TextEdit[]>();

  if (edit.changes) {
    for (const [uri, edits] of Object.entries(edit.changes)) {
      map.set(uri, edits);
    }
  }

  if (edit.documentChanges) {
    for (const dc of edit.documentChanges) {
      const uri = dc.textDocument.uri;
      const existing = map.get(uri) ?? [];
      map.set(uri, [...existing, ...dc.edits]);
    }
  }

  return map;
}

function applyTextEdits(content: string, edits: TextEdit[]): string {
  // Apply in reverse order (bottom-to-top) so earlier positions aren't invalidated
  const sorted = [...edits].sort((a, b) => {
    const lineDiff = b.range.start.line - a.range.start.line;
    return lineDiff !== 0 ? lineDiff : b.range.start.character - a.range.start.character;
  });

  for (const edit of sorted) {
    content = applySingleEdit(content, edit);
  }

  return content;
}

function applySingleEdit(content: string, edit: TextEdit): string {
  const lines = content.split("\n");
  const start = offsetOf(lines, edit.range.start.line, edit.range.start.character);
  const end = offsetOf(lines, edit.range.end.line, edit.range.end.character);
  return content.slice(0, start) + edit.newText + content.slice(end);
}

function offsetOf(lines: string[], line: number, character: number): number {
  let offset = 0;
  const clampedLine = Math.min(line, lines.length - 1);
  for (let i = 0; i < clampedLine; i++) {
    offset += lines[i].length + 1; // +1 for \n
  }
  return offset + Math.min(character, (lines[clampedLine] ?? "").length);
}
