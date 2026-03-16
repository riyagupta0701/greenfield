// Person C — Java backend usage tracking
// Tracks request field access: Spring @RequestBody binding, @RequestParam, getParameter
// Uses regex (same approach as backendDetector.ts) — no tree-sitter dependency

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

const JAVA_USAGE_NOISE = new Set([
  'equals', 'hashCode', 'toString', 'getClass', 'notify', 'notifyAll',
  'wait', 'clone', 'finalize', 'log', 'logger', 'this', 'super',
  'class', 'new', 'return', 'null', 'true', 'false',
]);

function isNoiseName(name: string): boolean {
  if (JAVA_USAGE_NOISE.has(name)) return true;
  if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return true;
  if (name.length <= 1) return true;
  return false;
}

// Strip generic type parameters: List<UserDto> → UserDto
function stripGenerics(typeName: string): string {
  return typeName.replace(/<[^>]+>/, '').trim();
}

// Extract field names from a DTO class declared within the file
function extractDtoFields(content: string, className: string): string[] {
  // Find class declaration
  const classRe = new RegExp(
    `class\\s+${className}\\s*(?:extends\\s+\\w+\\s*)?(?:implements[^{]+)?\\{([\\s\\S]*?)\\}`,
    'g'
  );
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(content)) !== null) {
    const body = m[1];
    // Match private/public/protected field declarations
    const fieldRe = /(?:private|public|protected)\s+(?:final\s+)?[\w<>\[\],\s]+\s+([a-z][a-zA-Z0-9_]*)\s*[;=]/g;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body)) !== null) {
      const name = fm[1];
      if (!isNoiseName(name)) {
        // Check for @JsonProperty override
        const precedingBody = body.substring(0, fm.index);
        const annotBlockRe = /(?:@\w+(?:\([^)]*\))?\s*)*$/;
        const annotBlock = annotBlockRe.exec(precedingBody)?.[0] ?? '';
        const jpRe = /@JsonProperty\(\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']\)/;
        const jpMatch = jpRe.exec(annotBlock);
        names.push(jpMatch ? jpMatch[1] : name);
      }
    }
  }
  return names;
}

// Extract getter call field names: req.getFirstName() → firstName
function getterToFieldName(getterName: string): string {
  // strip leading "get" and lowercase first char
  const withoutGet = getterName.replace(/^get/, '');
  if (withoutGet.length === 0) return '';
  return withoutGet.charAt(0).toLowerCase() + withoutGet.slice(1);
}

// Track request field reads in a Java backend file.
export function trackUsage(filePath: string): Field[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const fields: Field[] = [];

  // Pattern A1: @RequestBody Type paramName — extract getter/field access on param
  const requestBodyRe = /@RequestBody\s+(\w+(?:<[^>]+>)?)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = requestBodyRe.exec(content)) !== null) {
    const rawType = m[1];
    const paramName = m[2];
    const typeName = stripGenerics(rawType);

    // A2: getter calls: paramName.getSomeField()
    const getterRe = new RegExp(`${paramName}\\.get([A-Z]\\w*)\\(\\)`, 'g');
    let gm: RegExpExecArray | null;
    const accessedViaGetter: string[] = [];
    while ((gm = getterRe.exec(content)) !== null) {
      const fieldName = getterToFieldName(gm[1]);
      if (fieldName && !isNoiseName(fieldName)) {
        accessedViaGetter.push(fieldName);
        const line = lineOf(content, gm.index);
        fields.push({ name: fieldName, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
      }
    }

    // A3: direct field access: paramName.fieldName (not followed by '(')
    const directRe = new RegExp(`${paramName}\\.([a-z]\\w*)\\b(?!\\()`, 'g');
    let dm: RegExpExecArray | null;
    const accessedDirect: string[] = [];
    while ((dm = directRe.exec(content)) !== null) {
      const fieldName = dm[1];
      if (!isNoiseName(fieldName)) {
        accessedDirect.push(fieldName);
        const line = lineOf(content, dm.index);
        fields.push({ name: fieldName, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
      }
    }

    // Conservative rule: if no explicit field access found AND DTO is defined in file,
    // emit all DTO fields as accessed (param passed opaquely)
    if (accessedViaGetter.length === 0 && accessedDirect.length === 0) {
      const dtoFields = extractDtoFields(content, typeName);
      for (const fieldName of dtoFields) {
        const line = lineOf(content, m.index);
        fields.push({ name: fieldName, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
      }
    }
  }

  // Pattern B1: @RequestParam("x") or @RequestParam(value = "x")
  const rpNamedRe = /@RequestParam\(\s*(?:value\s*=\s*)?["']([a-zA-Z_][a-zA-Z0-9_]*)["']\)/g;
  while ((m = rpNamedRe.exec(content)) !== null) {
    const name = m[1];
    if (isNoiseName(name)) continue;
    const line = lineOf(content, m.index);
    fields.push({ name, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }

  // Pattern B2: @RequestParam Type paramName (no explicit name — param name IS field name)
  // Must not match the named form already handled above
  const rpTypedRe = /@RequestParam\s+\w[\w<>\[\],\s]*\s+([a-z]\w*)/g;
  while ((m = rpTypedRe.exec(content)) !== null) {
    const name = m[1];
    if (isNoiseName(name)) continue;
    const line = lineOf(content, m.index);
    fields.push({ name, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }

  // Pattern C: request.getParameter("x")
  const getParamRe = /request\.getParameter\(\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']\)/g;
  while ((m = getParamRe.exec(content)) !== null) {
    const name = m[1];
    if (isNoiseName(name)) continue;
    const line = lineOf(content, m.index);
    fields.push({ name, side: 'request', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }

  return dedup(fields);
}
