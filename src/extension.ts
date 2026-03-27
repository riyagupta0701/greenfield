import * as vscode from 'vscode';
import { mapEndpoints } from "./endpointMapper";
import { createStatusBar } from "./ui/statusBar";
import { GreenFieldDiagnosticProvider } from "./ui/diagnosticProvider";
import { GreenFieldHoverProvider } from "./ui/hoverProvider";
import { GreenFieldPanel } from "./ui/panel";
import { GreenFieldQuickFixProvider } from "./ui/quickFix";
import { FieldSet } from "./types";
// import { getDiffs } from "./diffEngine"; // Assuming diff engine will be imported later

export function activate(context: vscode.ExtensionContext) {
  const status = createStatusBar();
  const diagnosticProvider = new GreenFieldDiagnosticProvider();
  
  context.subscriptions.push(diagnosticProvider);

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      new GreenFieldHoverProvider(diagnosticProvider)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file' },
      new GreenFieldQuickFixProvider(diagnosticProvider),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
      }
    )
  );

  // Trigger scanning on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      // NOTE: Temporarily disabled real diff engine for MVP testing.
      // E.g. const fieldSets = await getDiffs(document.uri);
      
      // Quickly bail out for non-code files or unsupported languages to improve save performance
      const supportedLangs = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'python', 'java'];
      if (!supportedLangs.includes(document.languageId)) {
        return;
      }

      const docText = document.getText();
      
      // MOCK FIXTURE: Only trigger fake squiggle if 'lastLoginIp' is actually still in the text!
      const deadFields = [];
      if (docText.includes('lastLoginIp')) {
        // Find rough line number for mock visualization
        const lines = docText.split('\n');
        const lineIdx = lines.findIndex(l => l.includes('lastLoginIp'));
        
        deadFields.push({
          name: "lastLoginIp",
          side: "response" as const,
          wasteScore: 24,
          definedAt: {
            uri: document.uri.toString(),
            range: {
              startLine: lineIdx,
              startCharacter: 0,
              endLine: lineIdx,
              endCharacter: 11
            }
          }
        });
      }

      // Add a mock for a Java DTO field to test testing
      if (docText.includes('unusedToken')) {
        const lines = docText.split('\n');
        const lineIdx = lines.findIndex(l => l.includes('unusedToken'));
        
        deadFields.push({
          name: "unusedToken",
          side: "response" as const,
          wasteScore: 120, // arbitrary score
          definedAt: {
            uri: document.uri.toString(),
            range: {
              startLine: lineIdx,
              startCharacter: 0,
              endLine: lineIdx,
              endCharacter: 11
            }
          }
        });
      }

      const dummyFieldSets: FieldSet[] = [
        {
          endpoint: {
            pattern: "/api/test",
            method: "GET",
            backendFile: "backend.ts",
            frontendFiles: ["frontend.ts"]
          },
          definedFields: [],
          accessedFields: [],
          deadFields: deadFields
        }
      ];

      diagnosticProvider.update(dummyFieldSets);
    })
  );

  // Clear drifting diagnostics as the user types (Suggestion 4)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      diagnosticProvider.handleDocumentChange(event);
    })
  );

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

      // Dummy update diagnostic for now testing
      // diagnosticProvider.update(dummyFieldSets);

      const panel = GreenFieldPanel.createOrShow(context.extensionUri);
      
      // Inject some mock dead fields to guarantee we see data on the panel preview,
      // even if the real mapEndpoints returns an empty array in this mock project.
      const visuallyMockedEndpoints = endpoints.length > 0 ? endpoints.map((ep: any) => ({
        ...ep,
        deadFields: [
          {
            name: "unusedToken",
            side: "response",
            wasteScore: 120,
            definedAt: { uri: "file:///mock/UserDTO.java", range: { startLine: 5, startCharacter: 0, endLine: 5, endCharacter: 0 } }
          },
          {
            name: "lastLoginIp",
            side: "response",
            wasteScore: 24,
            definedAt: { uri: "file:///mock/Backend.ts", range: { startLine: 12, startCharacter: 0, endLine: 12, endCharacter: 0 } }
          }
        ]
      })) : [
        {
          endpoint: {
            pattern: "/api/users",
            method: "GET",
            backendFile: "backend.ts",
            frontendFiles: ["frontend.ts"]
          },
          definedFields: [],
          accessedFields: [],
          deadFields: [
            {
              name: "unusedToken",
              side: "response",
              wasteScore: 120,
              definedAt: { uri: "file:///mock/UserDTO.java", range: { startLine: 5, startCharacter: 0, endLine: 5, endCharacter: 0 } }
            },
            {
              name: "lastLoginIp",
              side: "response",
              wasteScore: 24,
              definedAt: { uri: "file:///mock/Backend.ts", range: { startLine: 12, startCharacter: 0, endLine: 12, endCharacter: 0 } }
            }
          ]
        }
      ];

      panel.update(visuallyMockedEndpoints as FieldSet[]);
      
      status.text = `⚡ GreenField: ${endpoints.length} endpoints`;

      vscode.window.showInformationMessage(
        `GreenField mapped ${endpoints.length} endpoints`
      );
    }
  );

  context.subscriptions.push(command, status);
}

export function deactivate() {}
