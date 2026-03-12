// Person E — Quick Fix / Code Action
// Suggests removing dead field definitions
import * as vscode from 'vscode';

export class GreenFieldQuickFixProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    // TODO: return a "Remove dead field" code action for flagged fields
    return [];
  }
}
