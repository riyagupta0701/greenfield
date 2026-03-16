// Person C — Python backend field extraction
// Extracts fields from Flask/FastAPI response objects and Pydantic models
// Uses regex (same approach as backendDetector.ts) — no tree-sitter dependency

import * as fs from 'fs';
import { Field } from '../../types';

function lineOf(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

function dedup(fields: Field[]): Field[] {
  const seen = new Set<string>();
  return fields.filter(f => {
    const key = `${f.name}:${f.definedAt}`;
    if (seen.has(key)) { return false; }
    seen.add(key);
    return true;
  });
}

// Pydantic BaseModel field names to exclude
const PYTHON_MODEL_NOISE = new Set([
  'model_config', 'model_fields', 'model_computed_fields',
  'schema_extra', 'validators', 'root_validator', 'Config', 'Meta',
]);

function isNoiseName(name: string): boolean {
  if (PYTHON_MODEL_NOISE.has(name)) return false; // handled separately
  // ALL_CAPS = constant
  if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return true;
  // dunder
  if (name.startsWith('__')) return true;
  // single char
  if (name.length <= 1) return true;
  return false;
}

function extractStringKeys(dictBody: string, filePath: string, bodyOffset: number, fileContent: string): Field[] {
  const fields: Field[] = [];
  const keyRe = /["']([a-zA-Z_][a-zA-Z0-9_]*)["']\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(dictBody)) !== null) {
    const name = m[1];
    if (isNoiseName(name)) continue;
    const absoluteIndex = bodyOffset + m.index;
    const line = lineOf(fileContent, absoluteIndex);
    fields.push({ name, side: 'response', definedAt: `${filePath}:${line}`, wasteScore: 0 });
  }
  return fields;
}

// Extract response fields defined in a Python backend file.
export function extractFields(filePath: string): Field[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const fields: Field[] = [];

  // Pattern A: jsonify({...})
  const jsonifyRe = /jsonify\(\s*\{([^}]*)\}/gs;
  let m: RegExpExecArray | null;
  while ((m = jsonifyRe.exec(content)) !== null) {
    const bodyStart = m.index + m[0].indexOf('{') + 1;
    fields.push(...extractStringKeys(m[1], filePath, bodyStart, content));
  }

  // Pattern B: return {...} (FastAPI direct dict return)
  const returnDictRe = /return\s*\{([^}]*)\}/gs;
  while ((m = returnDictRe.exec(content)) !== null) {
    const bodyStart = m.index + m[0].indexOf('{') + 1;
    fields.push(...extractStringKeys(m[1], filePath, bodyStart, content));
  }

  // Pattern C: JSONResponse(content={...})
  const jsonResponseRe = /JSONResponse\(\s*content\s*=\s*\{([^}]*)\}/gs;
  while ((m = jsonResponseRe.exec(content)) !== null) {
    const bodyStart = m.index + m[0].indexOf('{') + 1;
    fields.push(...extractStringKeys(m[1], filePath, bodyStart, content));
  }

  // Pattern D: Pydantic BaseModel class fields
  // Capture from class declaration to next class declaration or end of string
  const classRe = /class\s+\w+\s*\(\s*BaseModel\s*\)\s*:([\s\S]*?)(?=\nclass |$)/g;
  while ((m = classRe.exec(content)) !== null) {
    const classBody = m[1];
    const classBodyStart = m.index + m[0].indexOf(':') + 1;
    // Match indented field names: "    fieldName: type"
    const fieldRe = /^\s{4}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(classBody)) !== null) {
      const name = fm[1];
      if (PYTHON_MODEL_NOISE.has(name)) continue;
      if (isNoiseName(name)) continue;
      const absoluteIndex = classBodyStart + fm.index;
      const line = lineOf(content, absoluteIndex);
      fields.push({ name, side: 'response', definedAt: `${filePath}:${line}`, wasteScore: 0 });
    }
  }

  return dedup(fields);
}
