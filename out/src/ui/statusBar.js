"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatusBar = createStatusBar;
// Person E — Status Bar
// Shows: ⚡ GreenField: 18 dead fields | ~3.1 KB/req wasted
const vscode = require("vscode");
function createStatusBar() {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    item.text = "⚡ GreenField";
    item.show();
    return item;
}
//# sourceMappingURL=statusBar.js.map