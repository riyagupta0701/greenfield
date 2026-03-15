"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenFieldDiagnosticProvider = void 0;
// Person E — Diagnostic Provider
// Inline warning squiggles on dead field definitions
const vscode = require("vscode");
class GreenFieldDiagnosticProvider {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('greenfield');
    }
    update(fieldSets) {
        // TODO: convert dead fields to vscode.Diagnostic entries with waste info
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.GreenFieldDiagnosticProvider = GreenFieldDiagnosticProvider;
//# sourceMappingURL=diagnosticProvider.js.map