// Person A — Frontend API call detection
// Detects fetch, axios, useQuery, HttpClient calls → extracts URL + request body shape
import { Endpoint } from '../types';

import { normalizeUrl } from "./urlNormalizer"

export function detectFrontendEndpoints(code: string) {

  const endpoints = []

  const fetchRegex = /fetch\(['"`](.*?)['"`]/g
  const axiosRegex = /axios\.(get|post|put|delete)\(['"`](.*?)['"`]/g

  for (const match of code.matchAll(fetchRegex)) {

    endpoints.push({
      method: "GET",
      path: normalizeUrl(match[1])
    })

  }

  for (const match of code.matchAll(axiosRegex)) {

    endpoints.push({
      method: match[1].toUpperCase(),
      path: normalizeUrl(match[2])
    })

  }

  return endpoints
}
