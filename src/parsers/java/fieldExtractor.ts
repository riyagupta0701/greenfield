// Person C — Java backend field extraction
// Extracts fields from Spring @ResponseBody DTOs and response maps
// Uses regex (same approach as backendDetector.ts) — no tree-sitter dependency
// NOTE: Java records (`record UserDto(String name)`) are not supported in MVP.

import * as fs from 'fs';
import { Field } from '../../types';

function lineOf(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

function dedup(fields: Field[]): Field[] {
  const seen = new Set<string>();
  return fields.filter(f => {
    if (seen.has(f.name)) { return false; }
    seen.add(f.name);
    return true;
  });
}

const JAVA_FIELD_NOISE = new Set([
  'equals', 'hashCode', 'toString', 'getClass', 'notify', 'notifyAll',
  'wait', 'clone', 'finalize', 'log', 'logger', 'serialVersionUID',
]);

function isNoiseName(name: string): boolean {
  if (JAVA_FIELD_NOISE.has(name)) return true;
  // ALL_CAPS = constant
  if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return true;
  // class name (starts with uppercase)
  if (/^[A-Z]/.test(name)) return true;
  // single char
  if (name.length <= 1) return true;
  return false;
}

// Extract response fields defined in a Java backend file.
export function extractFields(filePath: string): Field[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const fields: Field[] = [];

  // Pattern A: DTO class fields — optionally preceded by @JsonProperty annotation
  // The regex captures the annotation block + access modifier + type + field name.
  // If @JsonProperty("name") is present in the match, use its value instead of the Java identifier.
  const fieldDeclRe = /(?:(?:@\w+(?:\([^)]*\))?\s*)*)(?:private|public|protected)\s+(?:final\s+)?[\w<>\[\],\s]+\s+([a-z][a-zA-Z0-9_]*)\s*[;=]/g;
  const jsonPropInlineRe = /@JsonProperty\(\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']\)/;
  let m: RegExpExecArray | null;
  while ((m = fieldDeclRe.exec(content)) !== null) {
    const javaName = m[1];
    if (isNoiseName(javaName)) continue;

    // Check if the matched text includes a @JsonProperty annotation
    const jpMatch = jsonPropInlineRe.exec(m[0]);
    const fieldName = jpMatch ? jpMatch[1] : javaName;
    const line = lineOf(content, m.index);
    fields.push({ name: fieldName, side: 'response', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }

  // Pattern B: Map.of("key", val, ...)
  const mapOfRe = /Map\.of\(([^)]+)\)/gs;
  while ((m = mapOfRe.exec(content)) !== null) {
    const inner = m[1];
    const keyRe = /"([a-zA-Z_][a-zA-Z0-9_]*)"\s*,/g;
    let km: RegExpExecArray | null;
    while ((km = keyRe.exec(inner)) !== null) {
      const name = km[1];
      if (isNoiseName(name)) continue;
      const absoluteIndex = m.index + m[0].indexOf(km[0]);
      const line = lineOf(content, absoluteIndex);
      fields.push({ name, side: 'response', definedAt: `${filePath}:${line}`, wasteScore: 0 });
    }
  }

  // Pattern C: .put("key", val)
  const putRe = /\.put\(\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']\s*,/g;
  while ((m = putRe.exec(content)) !== null) {
    const name = m[1];
    if (isNoiseName(name)) continue;
    const line = lineOf(content, m.index);
    fields.push({ name, side: 'response', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }

  return dedup(fields);
}
