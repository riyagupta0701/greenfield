import * as vscode from 'vscode';
import { mapEndpoints } from "./endpointMapper";
import { extractFields } from "./parsers/typescript/fieldExtractor";
import { trackUsage } from "./parsers/typescript/usageTracker";
import { extractFields as pyExtractFields } from "./parsers/python/fieldExtractor";
import { trackUsage as pyTrackUsage } from "./parsers/python/usageTracker";
import { extractFields as javaExtractFields } from "./parsers/java/fieldExtractor";
import { trackUsage as javaTrackUsage } from "./parsers/java/usageTracker";
import { extractFields as goExtractFields } from "./parsers/go/fieldExtractor";
import { trackUsage as goTrackUsage } from "./parsers/go/usageTracker";
import { createStatusBar } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext) {
  const status = createStatusBar();

  const command = vscode.commands.registerCommand(
    'greenfield.scanWorkspace',
    async () => {
      const files = await vscode.workspace.findFiles(
        "**/*.{ts,tsx,js,jsx,py,java,go}",
        "**/{node_modules,dist,build,.git,coverage,target,.next,__pycache__,vendor}/**"
      );

      const contents = await Promise.all(
        files.map(async (f: vscode.Uri) => ({
          path: f.fsPath,
          content: Buffer.from(await vscode.workspace.fs.readFile(f)).toString("utf8")
        }))
      );

      const endpoints = mapEndpoints(contents);

      // Per-language field counts
      const stats: { lang: string; resp: number; req: number }[] = [];

      function tally(
        lang: string,
        fsPath: string,
        extFn: (p: string) => { side: string }[],
        usageFn: (p: string) => unknown[]
      ) {
        let resp = 0, req = 0;
        try { resp = extFn(fsPath).filter(f => f.side === 'response').length; } catch { /* skip */ }
        try { req  = usageFn(fsPath).length; } catch { /* skip */ }
        return { resp, req };
      }

      const tsFiles   = files.filter(f => /\.[tj]sx?$/.test(f.fsPath));
      const pyFiles   = files.filter(f => f.fsPath.endsWith('.py'));
      const javaFiles = files.filter(f => f.fsPath.endsWith('.java'));
      const goFiles   = files.filter(f => f.fsPath.endsWith('.go'));

      const langGroups: [string, vscode.Uri[], (p: string) => { side: string }[], (p: string) => unknown[]][] = [
        ['TS',   tsFiles,   extractFields,     trackUsage    ],
        ['Py',   pyFiles,   pyExtractFields,   pyTrackUsage  ],
        ['Java', javaFiles, javaExtractFields, javaTrackUsage],
        ['Go',   goFiles,   goExtractFields,   goTrackUsage  ],
      ];

      for (const [lang, langFiles, extFn, usageFn] of langGroups) {
        let resp = 0, req = 0;
        for (const f of langFiles) {
          const t = tally(lang, f.fsPath, extFn, usageFn);
          resp += t.resp;
          req  += t.req;
        }
        if (resp > 0 || req > 0) stats.push({ lang, resp, req });
      }

      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(endpoints, null, 2),
        language: "json"
      });

      await vscode.window.showTextDocument(doc);

      status.text = `⚡ GreenField: ${endpoints.length} endpoints`;

      const langSummary = stats
        .map(s => `${s.lang}: ${s.resp} response fields, ${s.req} request fields`)
        .join(' | ');

      vscode.window.showInformationMessage(
        `GreenField mapped ${endpoints.length} endpoints` +
        (langSummary ? ` | ${langSummary}` : '')
      );
    }
  );

  context.subscriptions.push(command, status);
}

export function deactivate() {}
