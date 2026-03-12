// Person A — Endpoint Mapper
// Builds a canonical map: URL pattern → { backend handler, frontend callers }
import { Endpoint } from '../types';

export class EndpointMapper {
  // TODO: coordinate frontendDetector and backendDetector, return registry
  buildRegistry(): Map<string, Endpoint> {
    return new Map();
  }
}
