"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const endpointMapper_1 = require("./endpointMapper");
const statusBar_1 = require("./ui/statusBar");
function activate(context) {
    const status = (0, statusBar_1.createStatusBar)();
    const command = vscode.commands.registerCommand('greenfield.scan', async () => {
        const files = await vscode.workspace.findFiles("**/*.{ts,js,py,java}");
        const contents = await Promise.all(files.map(async (f) => ({
            path: f.fsPath,
            content: (await vscode.workspace.fs.readFile(f)).toString()
        })));
        const endpoints = (0, endpointMapper_1.mapEndpoints)(contents);
        vscode.window.showInformationMessage(`GreenField mapped ${endpoints.size} endpoints`);
    });
    context.subscriptions.push(command);
}
//# sourceMappingURL=extension.js.map