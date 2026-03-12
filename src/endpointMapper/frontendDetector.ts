// Person A — Frontend API call detection
// Detects fetch, axios, useQuery, HttpClient calls → extracts URL + request body shape
import { Endpoint } from '../types';

export function detectFrontendEndpoints(files: string[]): Partial<Endpoint>[] {
  // TODO: parse frontend files for API call patterns
  return [];
}
