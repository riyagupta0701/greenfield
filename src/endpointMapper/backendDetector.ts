// Person A — Backend route detection
// Detects @GetMapping, @app.route, router.get → extracts URL pattern
import { Endpoint } from '../types';

import { normalizeUrl } from "./urlNormalizer"

export function detectBackendEndpoints(code: string) {

  const endpoints = []

  const expressRegex = /app\.(get|post|put|delete)\(['"`](.*?)['"`]/g
  const flaskRegex = /@app\.route\(['"`](.*?)['"`]/g
  const springRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping)\(['"`](.*?)['"`]/g

  for (const match of code.matchAll(expressRegex)) {

    endpoints.push({
      method: match[1].toUpperCase(),
      path: normalizeUrl(match[2])
    })

  }

  for (const match of code.matchAll(flaskRegex)) {

    endpoints.push({
      method: "GET",
      path: normalizeUrl(match[1])
    })

  }

  for (const match of code.matchAll(springRegex)) {

    const method = match[1].replace("Mapping","").toUpperCase()

    endpoints.push({
      method,
      path: normalizeUrl(match[2])
    })

  }

  return endpoints
}
