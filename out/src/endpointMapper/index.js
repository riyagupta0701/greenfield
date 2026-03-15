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
            const key = ep.method + " " + ep.path;
            if (!registry.has(key)) {
                registry.set(key, { frontend: [], backend: [] });
            }
            registry.get(key).frontend.push(file.path);
        }
        for (const ep of backend) {
            const key = ep.method + " " + ep.path;
            if (!registry.has(key)) {
                registry.set(key, { frontend: [], backend: [] });
            }
            registry.get(key).backend.push(file.path);
        }
    }
    return registry;
}
//# sourceMappingURL=index.js.map