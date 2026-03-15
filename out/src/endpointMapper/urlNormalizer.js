"use strict";
// Person A — URL normalization
// Normalizes :id, {id}, <id> → canonical form for matching
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
function normalizeUrl(url) {
    let u = url;
    u = u.replace(/\{[^}]+\}/g, ":param");
    u = u.replace(/<[^>]+>/g, ":param");
    u = u.replace(/:[A-Za-z_]+/g, ":param");
    u = u.replace(/\$\{[^}]+\}/g, ":param");
    if (!u.startsWith("/"))
        u = "/" + u;
    return u;
}
//# sourceMappingURL=urlNormalizer.js.map