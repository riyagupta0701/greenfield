"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFrontendEndpoints = detectFrontendEndpoints;
const urlNormalizer_1 = require("./urlNormalizer");
function detectFrontendEndpoints(code) {
    const endpoints = [];
    const fetchRegex = /fetch\(['"`](.*?)['"`]/g;
    const axiosRegex = /axios\.(get|post|put|delete)\(['"`](.*?)['"`]/g;
    for (const match of code.matchAll(fetchRegex)) {
        endpoints.push({
            method: "GET",
            path: (0, urlNormalizer_1.normalizeUrl)(match[1])
        });
    }
    for (const match of code.matchAll(axiosRegex)) {
        endpoints.push({
            method: match[1].toUpperCase(),
            path: (0, urlNormalizer_1.normalizeUrl)(match[2])
        });
    }
    return endpoints;
}
//# sourceMappingURL=frontendDetector.js.map