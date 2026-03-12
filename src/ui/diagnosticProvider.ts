// Person E — Diagnostic Provider
// Inline warning squiggles on dead field definitions
import * as vscode from 'vscode';
import { FieldSet } from '../types';

export class GreenFieldDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('greenfield');
  }

  update(fieldSets: FieldSet[]): void {
    // TODO: convert dead fields to vscode.Diagnostic entries with waste info
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
