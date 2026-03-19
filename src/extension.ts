import * as vscode from 'vscode';
import { mapEndpoints } from "./endpointMapper";
import { createStatusBar } from "./ui/statusBar";
import { runDiff } from "./diffEngine";
import { Endpoint, FieldSet } from "./types";
import { extractFields as tsExtractFields, trackUsage as tsTrackUsage, extractBackendResponseFields as tsExtractBackendFields } from "./parsers/typescript";
import { extractFields as pyExtractFields } from "./parsers/python";
import { trackUsage as javaTrackUsage } from "./parsers/java";

/**
 * Build a FieldSet for an endpoint using the appropriate parsers.
 *
 * Coverage:
 *   Python backend  → response fields (pyExtractFields + tsTrackUsage)
 *   Java backend    → request fields  (tsExtractFields + javaTrackUsage)
 *   TS/JS backend   → skipped (no TS backend response extractor yet)
 */
function buildFieldSet(endpoint: Endpoint): FieldSet | null {
  const { backendFile, frontendFiles } = endpoint;
  if (!backendFile || frontendFiles.length === 0) return null;

  if (backendFile.endsWith('.py')) {
    return {
      endpoint,
      definedFields:  pyExtractFields(backendFile),
      accessedFields: frontendFiles.flatMap(f => tsTrackUsage(f)),
    };
  }

  if (backendFile.endsWith('.java')) {
    return {
      endpoint,
      definedFields:  frontendFiles.flatMap(f => tsExtractFields(f)),
      accessedFields: javaTrackUsage(backendFile),
    };
  }

  // TS/JS backend — response fields from res.json({...}) calls
  if (backendFile.match(/\.[jt]sx?$/)) {
    return {
      endpoint,
      definedFields:  tsExtractBackendFields(backendFile),
      accessedFields: frontendFiles.flatMap(f => tsTrackUsage(f)),
    };
  }

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  const status = createStatusBar();

  const command = vscode.commands.registerCommand(
    'greenfield.scanWorkspace',
    async () => {
      const files = await vscode.workspace.findFiles(
        "**/*.{ts,tsx,js,jsx,py,java}",
        "**/{node_modules,dist,build,.git,coverage,target,.next,__pycache__}/**"
      );

      const contents = await Promise.all(
        files.map(async (f: vscode.Uri) => ({
          path: f.fsPath,
          content: Buffer.from(await vscode.workspace.fs.readFile(f)).toString("utf8")
        }))
      );

      const endpoints = mapEndpoints(contents);

      // Run diff only where parsers are available (Python/Java backends).
      // TS/JS backends are shown in the output but skipped for dead-field analysis
      // until a TS backend response extractor is implemented.
      const fieldSets: FieldSet[] = endpoints
        .map(buildFieldSet)
        .filter((fs): fs is FieldSet => fs !== null)
        .map(fs => runDiff(fs));

      const totalDead = fieldSets.reduce((n, fs) => n + (fs.deadFields?.length ?? 0), 0);
      const totalWasteBytes = fieldSets.reduce((n, fs) =>
        n + (fs.deadFields?.reduce((s, f) => s + (f.wasteScore ?? 0), 0) ?? 0), 0);

      // Always show all endpoints; annotate with dead fields where available
      const output = {
        endpoints,
        deadFieldAnalysis: fieldSets,
      };

      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(output, null, 2),
        language: "json"
      });

      await vscode.window.showTextDocument(doc);

      const kb = (totalWasteBytes / 1000).toFixed(1);
      status.text = `⚡ GreenField: ${endpoints.length} endpoints | ${totalDead} dead fields | ~${kb} KB/req wasted`;

      vscode.window.showInformationMessage(
        `GreenField: ${endpoints.length} endpoints mapped, ${totalDead} dead fields found (${kb} KB/req wasted)`
      );
    }
  );

  context.subscriptions.push(command, status);
}

export function deactivate() {}
