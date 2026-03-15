"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const endpointMapper_1 = require("./endpointMapper");
const statusBar_1 = require("./ui/statusBar");
function activate(context) {
    const status = (0, statusBar_1.createStatusBar)();
    const command = vscode.commands.registerCommand('greenfield.scanWorkspace', async () => {
        const files = await vscode.workspace.findFiles("**/*.{ts,tsx,js,jsx,py,java}", "**/{node_modules,dist,build,.git,coverage,target,.next,__pycache__}/**");
        const contents = await Promise.all(files.map(async (f) => ({
            path: f.fsPath,
            content: Buffer.from(await vscode.workspace.fs.readFile(f)).toString("utf8")
        })));
        const endpoints = (0, endpointMapper_1.mapEndpoints)(contents);
        const doc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(endpoints, null, 2),
            language: "json"
        });
        await vscode.window.showTextDocument(doc);
        status.text = `⚡ GreenField: ${endpoints.length} endpoints`;
        vscode.window.showInformationMessage(`GreenField mapped ${endpoints.length} endpoints`);
    });
    context.subscriptions.push(command, status);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map