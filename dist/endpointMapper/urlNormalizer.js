"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
function normalizeUrl(path) {
    let p = path;
    // template literal parameters
    p = p.replace(/\$\{[^}]+\}/g, ":param");
    // express style
    p = p.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ":param");
    // flask style
    p = p.replace(/<[^>]+>/g, ":param");
    // spring style
    p = p.replace(/\{[^}]+\}/g, ":param");
    return p;
}
//# sourceMappingURL=urlNormalizer.js.map