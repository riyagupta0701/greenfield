// Person E — Status Bar
// Shows: ⚡ GreenField: 18 dead fields | ~3.1 KB/req wasted
import * as vscode from 'vscode';
import { FieldSet } from '../types';

export class GreenFieldStatusBar {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  }

  update(fieldSets: FieldSet[]): void {
    // TODO: count dead fields and sum waste, update status bar text
  }

  dispose(): void {
    this.item.dispose();
  }
}
