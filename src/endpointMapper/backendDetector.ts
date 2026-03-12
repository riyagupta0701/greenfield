// Person A — Backend route detection
// Detects @GetMapping, @app.route, router.get → extracts URL pattern
import { Endpoint } from '../types';

export function detectBackendEndpoints(files: string[]): Partial<Endpoint>[] {
  // TODO: parse backend files for route definitions
  return [];
}
