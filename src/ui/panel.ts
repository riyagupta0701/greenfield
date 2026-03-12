// Person E — GreenField Panel (WebviewPanel)
// Per-endpoint breakdown: live vs dead fields, waste score
import * as vscode from 'vscode';
import { FieldSet } from '../types';

export class GreenFieldPanel {
  static currentPanel: GreenFieldPanel | undefined;

  static createOrShow(extensionUri: vscode.Uri): void {
    // TODO: create or reveal the GreenField webview panel
  }

  update(fieldSets: FieldSet[]): void {
    // TODO: render per-endpoint breakdown in the webview
  }
}
