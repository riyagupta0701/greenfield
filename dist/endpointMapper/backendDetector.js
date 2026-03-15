"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBackendEndpoints = detectBackendEndpoints;
const urlNormalizer_1 = require("./urlNormalizer");
function detectBackendEndpoints(code) {
    const endpoints = [];
    const expressRegex = /app\.(get|post|put|delete)\(['"`](.*?)['"`]/g;
    const flaskRegex = /@app\.route\(['"`](.*?)['"`]/g;
    const springRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping)\(['"`](.*?)['"`]/g;
    for (const match of code.matchAll(expressRegex)) {
        endpoints.push({
            method: match[1].toUpperCase(),
            path: (0, urlNormalizer_1.normalizeUrl)(match[2])
        });
    }
    for (const match of code.matchAll(flaskRegex)) {
        endpoints.push({
            method: "GET",
            path: (0, urlNormalizer_1.normalizeUrl)(match[1])
        });
    }
    for (const match of code.matchAll(springRegex)) {
        const method = match[1].replace("Mapping", "").toUpperCase();
        endpoints.push({
            method,
            path: (0, urlNormalizer_1.normalizeUrl)(match[2])
        });
    }
    return endpoints;
}
//# sourceMappingURL=backendDetector.js.map