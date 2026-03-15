import * as vscode from 'vscode';
import { mapEndpoints } from "./endpointMapper";
import { createStatusBar } from "./ui/statusBar";

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

      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(endpoints, null, 2),
        language: "json"
      });

      await vscode.window.showTextDocument(doc);

      status.text = `⚡ GreenField: ${endpoints.length} endpoints`;

      vscode.window.showInformationMessage(
        `GreenField mapped ${endpoints.length} endpoints`
      );
    }
  );

  context.subscriptions.push(command, status);
}

export function deactivate() {}
