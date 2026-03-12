// Person E — Hover Provider
// Shows: "lastLoginIp — never accessed by frontend. ~24 bytes/req wasted"
import * as vscode from 'vscode';
import { FieldSet } from '../types';

export class GreenFieldHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    // TODO: detect if cursor is on a dead field, return waste hover message
    return null;
  }
}
