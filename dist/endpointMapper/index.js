"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapEndpoints = mapEndpoints;
const backendDetector_1 = require("./backendDetector");
const frontendDetector_1 = require("./frontendDetector");
function mapEndpoints(files) {
    const registry = new Map();
    for (const file of files) {
        const frontend = (0, frontendDetector_1.detectFrontendEndpoints)(file.content);
        const backend = (0, backendDetector_1.detectBackendEndpoints)(file.content);
        for (const ep of frontend) {
            const key = `${ep.method} ${ep.path}`;
            if (!registry.has(key)) {
                registry.set(key, { frontend: [], backend: [] });
            }
            const entry = registry.get(key);
            if (!entry.frontend.includes(file.path)) {
                entry.frontend.push(file.path);
            }
        }
        for (const ep of backend) {
            const key = `${ep.method} ${ep.path}`;
            if (!registry.has(key)) {
                registry.set(key, { frontend: [], backend: [] });
            }
            const entry = registry.get(key);
            if (!entry.backend.includes(file.path)) {
                entry.backend.push(file.path);
            }
        }
    }
    const endpoints = [];
    for (const [pattern, entry] of registry.entries()) {
        const method = pattern.split(" ")[0];
        endpoints.push({
            pattern,
            method,
            backendFile: entry.backend[0] ?? "",
            frontendFiles: entry.frontend
        });
    }
    endpoints.sort((a, b) => a.pattern.localeCompare(b.pattern));
    return endpoints;
}
//# sourceMappingURL=index.js.map