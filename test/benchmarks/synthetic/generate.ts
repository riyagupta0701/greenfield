/**
 * RQ1 Benchmark Generator
 *
 * Generates 20 synthetic full-stack projects from the spec below.
 * The generated project-XX/ directories are gitignored — run this script
 * before evaluation to (re)create them:
 *
 *   npx ts-node test/benchmarks/synthetic/generate.ts
 */
import * as fs   from 'fs';
import * as path from 'path';

// Spec types 

type BackendLang   = 'ts' | 'python' | 'java';
type TsPattern     = 'direct' | 'destructuring' | 'optional-chain' | 'jsx' | 'template' | 'dynamic' | 'dynamic-mixed';
type PythonPattern = 'pydantic' | 'jsonresponse';
type JavaAccess    = 'getter' | 'direct';

interface ProjectSpec {
  id:            string;
  description:   string;
  backendLang:   BackendLang;
  endpoint:      string;       // normalised, e.g. 'GET /api/users/:id'
  frontendExt:   'ts' | 'tsx';
  allFields:     string[];     // all fields defined by backend
  accessedFields: string[];    // fields actually used by frontend
  deadFields:    string[];     // expected dead fields
  // TS-specific
  tsPattern?:     TsPattern;
  // Python-specific
  pythonPattern?: PythonPattern;
  pydanticClass?: string;
  // Java-specific
  controllerClass?: string;
  dtoClass?:        string;
  paramName?:       string;
  javaAccess?:      JavaAccess;
}

// Spec

const SPECS: ProjectSpec[] = [
  // 01-03: Direct field access (TS)
  {
    id: '01', description: 'Direct field access',
    backendLang: 'ts', endpoint: 'GET /api/users/:id',
    frontendExt: 'ts', tsPattern: 'direct',
    allFields:      ['id', 'name', 'email', 'lastLoginIp', 'createdAt'],
    accessedFields: ['id', 'name', 'email'],
    deadFields:     ['lastLoginIp', 'createdAt'],
  },
  {
    id: '02', description: 'Direct field access',
    backendLang: 'ts', endpoint: 'GET /api/products/:id',
    frontendExt: 'ts', tsPattern: 'direct',
    allFields:      ['productId', 'title', 'price', 'stock', 'internalSku', 'warehouseId'],
    accessedFields: ['productId', 'title', 'price'],
    deadFields:     ['stock', 'internalSku', 'warehouseId'],
  },
  {
    id: '03', description: 'Direct field access (auth response)',
    backendLang: 'ts', endpoint: 'POST /api/auth/login',
    frontendExt: 'ts', tsPattern: 'direct',
    allFields:      ['token', 'userId', 'expiresAt', 'role', 'refreshToken', 'sessionId'],
    accessedFields: ['token', 'userId'],
    deadFields:     ['expiresAt', 'role', 'refreshToken', 'sessionId'],
  },
  // 04-06: Destructuring (TS)
  {
    id: '04', description: 'Destructuring',
    backendLang: 'ts', endpoint: 'GET /api/orders',
    frontendExt: 'ts', tsPattern: 'destructuring',
    allFields:      ['id', 'total', 'status', 'createdAt', 'customerId', 'notes', 'internalRef'],
    accessedFields: ['id', 'total', 'status'],
    deadFields:     ['createdAt', 'customerId', 'notes', 'internalRef'],
  },
  {
    id: '05', description: 'Destructuring',
    backendLang: 'ts', endpoint: 'GET /api/profile',
    frontendExt: 'ts', tsPattern: 'destructuring',
    allFields:      ['username', 'email', 'avatar', 'bio', 'lastSeen', 'isAdmin', 'twoFaSecret'],
    accessedFields: ['username', 'email', 'avatar'],
    deadFields:     ['bio', 'lastSeen', 'isAdmin', 'twoFaSecret'],
  },
  {
    id: '06', description: 'Destructuring',
    backendLang: 'ts', endpoint: 'GET /api/payments/:id',
    frontendExt: 'ts', tsPattern: 'destructuring',
    allFields:      ['orderId', 'amount', 'currency', 'fee', 'processorRef', 'rawPayload'],
    accessedFields: ['orderId', 'amount', 'currency'],
    deadFields:     ['fee', 'processorRef', 'rawPayload'],
  },
  // 07-09: Optional chaining (TS)
  {
    id: '07', description: 'Optional chaining',
    backendLang: 'ts', endpoint: 'GET /api/members/:id',
    frontendExt: 'ts', tsPattern: 'optional-chain',
    allFields:      ['id', 'name', 'email', 'phone', 'address', 'internalId'],
    accessedFields: ['id', 'name'],
    deadFields:     ['email', 'phone', 'address', 'internalId'],
  },
  {
    id: '08', description: 'Optional chaining',
    backendLang: 'ts', endpoint: 'GET /api/posts/:id',
    frontendExt: 'ts', tsPattern: 'optional-chain',
    allFields:      ['postId', 'title', 'body', 'authorId', 'draftKey', 'internalRevision'],
    accessedFields: ['postId', 'title', 'body'],
    deadFields:     ['authorId', 'draftKey', 'internalRevision'],
  },
  {
    id: '09', description: 'Optional chaining',
    backendLang: 'ts', endpoint: 'GET /api/cart',
    frontendExt: 'ts', tsPattern: 'optional-chain',
    allFields:      ['cartId', 'items', 'total', 'discount', 'promoCode', 'internalSessionId'],
    accessedFields: ['cartId', 'items', 'total'],
    deadFields:     ['discount', 'promoCode', 'internalSessionId'],
  },
  // 10-11: JSX (TSX)
  {
    id: '10', description: 'JSX field access',
    backendLang: 'ts', endpoint: 'GET /api/catalog/:id',
    frontendExt: 'tsx', tsPattern: 'jsx',
    allFields:      ['name', 'price', 'description', 'sku', 'costPrice', 'supplierRef'],
    accessedFields: ['name', 'price'],
    deadFields:     ['description', 'sku', 'costPrice', 'supplierRef'],
  },
  {
    id: '11', description: 'JSX field access',
    backendLang: 'ts', endpoint: 'GET /api/users/:id/public',
    frontendExt: 'tsx', tsPattern: 'jsx',
    allFields:      ['username', 'avatar', 'followers', 'following', 'privateKey', 'adminNotes'],
    accessedFields: ['username', 'avatar'],
    deadFields:     ['followers', 'following', 'privateKey', 'adminNotes'],
  },
  // 12: Template literals (TS)
  {
    id: '12', description: 'Template literals',
    backendLang: 'ts', endpoint: 'GET /api/greet/:id',
    frontendExt: 'ts', tsPattern: 'template',
    allFields:      ['firstName', 'lastName', 'email', 'hashedPassword', 'salt', 'lastIp'],
    accessedFields: ['firstName', 'lastName'],
    deadFields:     ['email', 'hashedPassword', 'salt', 'lastIp'],
  },
  // 13-14: Dynamic bracket access — must not flag any fields (TS)
  {
    id: '13', description: 'Dynamic bracket access — must not flag any fields',
    backendLang: 'ts', endpoint: 'GET /api/config',
    frontendExt: 'ts', tsPattern: 'dynamic',
    allFields:      ['alpha', 'beta', 'gamma', 'delta'],
    accessedFields: [],
    deadFields:     [],
  },
  {
    id: '14', description: 'Dynamic bracket access via Object.keys — must not flag',
    backendLang: 'ts', endpoint: 'GET /api/metrics',
    frontendExt: 'ts', tsPattern: 'dynamic',
    allFields:      ['x', 'y', 'z', 'w'],
    accessedFields: [],
    deadFields:     [],
  },
  // 15: Mixed static + dynamic — conservative rule protects all (TS)
  {
    id: '15', description: 'Mixed static + dynamic — conservative rule protects all',
    backendLang: 'ts', endpoint: 'GET /api/settings',
    frontendExt: 'ts', tsPattern: 'dynamic-mixed',
    allFields:      ['id', 'name', 'secret', 'internal'],
    accessedFields: ['id'],
    deadFields:     [],
  },
  // 16-17: Python backends
  {
    id: '16', description: 'Python FastAPI with Pydantic response model',
    backendLang: 'python', endpoint: 'GET /api/users/:id',
    frontendExt: 'ts', pythonPattern: 'pydantic', pydanticClass: 'UserResponse',
    allFields:      ['userId', 'displayName', 'email', 'createdAt', 'internalToken', 'adminFlag'],
    accessedFields: ['userId', 'displayName'],
    deadFields:     ['email', 'createdAt', 'internalToken', 'adminFlag'],
  },
  {
    id: '17', description: 'Python FastAPI with JSONResponse',
    backendLang: 'python', endpoint: 'GET /api/status',
    frontendExt: 'ts', pythonPattern: 'jsonresponse',
    allFields:      ['status', 'code', 'debugInfo', 'traceId'],
    accessedFields: ['status'],
    deadFields:     ['code', 'debugInfo', 'traceId'],
  },
  // 18-20: Java Spring @RequestBody
  {
    id: '18', description: 'Spring @RequestBody — getter access',
    backendLang: 'java', endpoint: 'POST /orders',
    frontendExt: 'ts', controllerClass: 'OrderController', dtoClass: 'OrderDto',
    paramName: 'order', javaAccess: 'getter',
    allFields:      ['customerId', 'items', 'shippingAddress', 'promoCode', 'internalRef', 'priority'],
    accessedFields: ['customerId', 'items'],
    deadFields:     ['shippingAddress', 'promoCode', 'internalRef', 'priority'],
  },
  {
    id: '19', description: 'Spring @RequestBody — direct field access',
    backendLang: 'java', endpoint: 'POST /products',
    frontendExt: 'ts', controllerClass: 'ProductController', dtoClass: 'ProductDto',
    paramName: 'dto', javaAccess: 'direct',
    allFields:      ['title', 'price', 'category', 'internalCode', 'warehouseId'],
    accessedFields: ['title', 'price'],
    deadFields:     ['category', 'internalCode', 'warehouseId'],
  },
  {
    id: '20', description: 'Spring @RequestBody — getter access',
    backendLang: 'java', endpoint: 'POST /users',
    frontendExt: 'ts', controllerClass: 'UserController', dtoClass: 'UserDto',
    paramName: 'req', javaAccess: 'getter',
    allFields:      ['firstName', 'lastName', 'emailAddress', 'age', 'phone_number', 'date_of_birth'],
    accessedFields: ['firstName', 'lastName'],
    deadFields:     ['emailAddress', 'age', 'phone_number', 'date_of_birth'],
  },
];

// Helpers

function mkdirp(dir: string): void { fs.mkdirSync(dir, { recursive: true }); }
function write(file: string, content: string): void {
  mkdirp(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}

/** Convert normalised URL (:param) to Express/Python path params */
function toExpressUrl(url: string): string { return url; }
function toPythonUrl(url: string): string  { return url.replace(/:([a-z_]+)/g, '{$1}'); }

/** Simple dummy values — parsers care about field names, not values */
function dummyVal(field: string): string {
  if (field === 'items' || field.endsWith('List')) return '[]';
  if (field.endsWith('Flag') || /^is[A-Z]/.test(field)) return 'false';
  if (['price', 'amount', 'fee', 'total', 'costPrice'].includes(field)) return '9.99';
  if (field === 'id' || /[Ii]d$/.test(field)) return '1';
  return "'value'";
}

/** camelCase a snake_case or already-camel field for Java getters */
function toGetter(field: string): string {
  const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return 'get' + camel.charAt(0).toUpperCase() + camel.slice(1);
}

// TS backend

function genTsBackend(spec: ProjectSpec): string {
  const [method, url] = spec.endpoint.split(' ');
  const expressMethod = method.toLowerCase();
  const fields = spec.allFields.map(f => `    ${f}: ${dummyVal(f)},`).join('\n');
  return [
    `// Pattern: ${spec.description}`,
    `import express from 'express';`,
    `const app = express();`,
    ``,
    `app.${expressMethod}('${toExpressUrl(url)}', (req: any, res: any) => {`,
    `  res.json({`,
    fields,
    `  });`,
    `});`,
    ``,
  ].join('\n');
}

// TS frontend templates

function genDirect(spec: ProjectSpec): string {
  const [method, url] = spec.endpoint.split(' ');
  const paramUrl = url.replace(/:([a-z]+)/g, '${id}');
  const isGet = method === 'GET';
  const callExpr = isGet
    ? `axios.get(\`${paramUrl}\`)`
    : `axios.post('${url}', {})`;
  const accesses = spec.accessedFields.map(f => `  console.log(res.data.${f});`).join('\n');
  return [
    `// Pattern: ${spec.description} — only accesses ${spec.accessedFields.join(', ')}`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData(id: number) {`,
    `  const res = await ${callExpr};`,
    accesses,
    `  // ${spec.deadFields.join(', ')} never accessed`,
    `}`,
    ``,
  ].join('\n');
}

function genDestructuring(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const accessed = spec.accessedFields.join(', ');
  return [
    `// Pattern: ${spec.description} — only unpacks ${accessed}`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData() {`,
    `  const res = await axios.get('${url}');`,
    `  const { ${accessed} } = res.data;`,
    `  return { ${accessed} };`,
    `  // ${spec.deadFields.join(', ')} never destructured`,
    `}`,
    ``,
  ].join('\n');
}

function genOptionalChain(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const paramUrl = url.replace(/:([a-z]+)/g, '${id}');
  const accesses = spec.accessedFields
    .map((f, i) => `  const var${i} = res.data?.${f};`)
    .join('\n');
  return [
    `// Pattern: ${spec.description} — only reads ${spec.accessedFields.join(', ')}`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData(id: string) {`,
    `  const res = await axios.get(\`${paramUrl}\`);`,
    accesses,
    `  // ${spec.deadFields.join(', ')} never accessed`,
    `}`,
    ``,
  ].join('\n');
}

function genJsx(spec: ProjectSpec): string {
  const jsxLines = spec.accessedFields.map(f => {
    if (f === 'avatar' || f === 'image') return `      <img src={item.${f}} alt="${f}" />`;
    return `      <p>{item.${f}}</p>`;
  }).join('\n');
  return [
    `// Pattern: ${spec.description} — only renders ${spec.accessedFields.join(', ')}`,
    `import React from 'react';`,
    `import axios from 'axios';`,
    ``,
    `function ItemCard({ item }: { item: any }) {`,
    `  return (`,
    `    <div>`,
    jsxLines,
    `    </div>`,
    `  );`,
    `  // ${spec.deadFields.join(', ')} never used in JSX or elsewhere`,
    `}`,
    ``,
  ].join('\n');
}

function genTemplate(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const paramUrl = url.replace(/:([a-z]+)/g, '${id}');
  const tmpl = spec.accessedFields.map(f => `\${data.${f}}`).join(' ');
  return [
    `// Pattern: ${spec.description} — only uses ${spec.accessedFields.join(', ')}`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData(id: string) {`,
    `  const res = await axios.get(\`${paramUrl}\`);`,
    `  const data = res.data;`,
    `  const message = \`${tmpl}\`;`,
    `  return message;`,
    `  // ${spec.deadFields.join(', ')} never accessed`,
    `}`,
    ``,
  ].join('\n');
}

function genDynamic(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  return [
    `// Pattern: ${spec.description}`,
    `// GreenField must NOT flag any fields as dead (conservative rule for dynamic access)`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData(keys: string[]) {`,
    `  const res = await axios.get('${url}');`,
    `  const data = res.data;`,
    `  // Dynamic bracket access — static analysis cannot determine which fields are read`,
    `  return keys.map(k => data[k]);`,
    `}`,
    ``,
  ].join('\n');
}

function genDynamicMixed(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const staticField = spec.accessedFields[0] ?? 'id';
  return [
    `// Pattern: ${spec.description}`,
    `// '${staticField}' accessed statically; rest via dynamic key — conservative rule applies`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData() {`,
    `  const res = await axios.get('${url}');`,
    `  const data = res.data as any;`,
    `  const ${staticField} = data.${staticField};                   // static`,
    `  const keys = Object.keys(data).filter(k => k !== '${staticField}');`,
    `  return { ${staticField}, rest: keys.map(k => (data as any)[k]) };`,
    `}`,
    ``,
  ].join('\n');
}

// Python backend templates

function genPydantic(spec: ProjectSpec): string {
  const cls  = spec.pydanticClass ?? 'Response';
  const url  = toPythonUrl(spec.endpoint.replace(/^GET /, ''));
  const fieldDefs  = spec.allFields.map(f => `    ${f}: str`).join('\n');
  const ctorArgs   = spec.allFields.map(f => `        ${f}='value',`).join('\n');
  return [
    `# Pattern: ${spec.description}`,
    `from fastapi import FastAPI`,
    `from pydantic import BaseModel`,
    ``,
    `app = FastAPI()`,
    ``,
    `class ${cls}(BaseModel):`,
    fieldDefs,
    ``,
    `@app.get('${url}')`,
    `def handler(id: int = 0) -> ${cls}:`,
    `    return ${cls}(`,
    ctorArgs,
    `    )`,
    ``,
  ].join('\n');
}

function genJsonResponse(spec: ProjectSpec): string {
  const url    = toPythonUrl(spec.endpoint.replace(/^GET /, ''));
  const fields = spec.allFields.map(f => `        '${f}': 'value',`).join('\n');
  return [
    `# Pattern: ${spec.description}`,
    `from fastapi import FastAPI`,
    `from fastapi.responses import JSONResponse`,
    ``,
    `app = FastAPI()`,
    ``,
    `@app.get('${url}')`,
    `def handler():`,
    `    return JSONResponse(content={`,
    fields,
    `        # ${spec.deadFields.join(', ')} — never accessed by frontend`,
    `    })`,
    ``,
  ].join('\n');
}

// Java backend template

function genJavaController(spec: ProjectSpec): string {
  const cls       = spec.controllerClass!;
  const dto       = spec.dtoClass!;
  const param     = spec.paramName!;
  const [method, url] = spec.endpoint.split(' ');
  const annotation = method === 'POST' ? 'PostMapping' : 'GetMapping';
  const routePath  = '/' + url.split('/').filter(Boolean).join('/');

  const accessBody = spec.accessedFields.map(f => {
    if (spec.javaAccess === 'getter') {
      return `        Object ${f}Val = ${param}.${toGetter(f)}();`;
    }
    return `        Object ${f}Val = ${param}.${f};`;
  }).join('\n');

  return [
    `package com.example.benchmark;`,
    ``,
    `import org.springframework.web.bind.annotation.*;`,
    ``,
    `@RestController`,
    `@RequestMapping("/api")`,
    `public class ${cls} {`,
    ``,
    `    // Reads: ${spec.accessedFields.join(', ')}`,
    `    // Dead:  ${spec.deadFields.join(', ')}`,
    `    @${annotation}("${routePath}")`,
    `    public String handle(@RequestBody ${dto} ${param}) {`,
    accessBody,
    `        return "ok";`,
    `    }`,
    `}`,
    ``,
  ].join('\n');
}

// Frontend for Java projects (sends all fields via axios.post) 

function genJavaFrontend(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const fields = spec.allFields.map(f => `    ${f}: 'value',`).join('\n');
  return [
    `// Pattern: ${spec.description} — sends all fields including unused ones`,
    `import axios from 'axios';`,
    ``,
    `async function sendData() {`,
    `  await axios.post('${url}', {`,
    fields,
    `    // ${spec.deadFields.join(', ')} never read by backend`,
    `  });`,
    `}`,
    ``,
  ].join('\n');
}

// Frontend for Python projects (destructuring response fields)

function genPythonFrontend(spec: ProjectSpec): string {
  const [, url] = spec.endpoint.split(' ');
  const paramUrl = url.replace(/:([a-z]+)/g, '${id}');
  const accessed = spec.accessedFields.join(', ');
  return [
    `// Pattern: ${spec.description} — only reads ${accessed}`,
    `import axios from 'axios';`,
    ``,
    `async function fetchData(id: number) {`,
    `  const res = await axios.get(\`${paramUrl}\`);`,
    `  const { ${accessed} } = res.data;`,
    `  return { ${accessed} };`,
    `  // ${spec.deadFields.join(', ')} never read`,
    `}`,
    ``,
  ].join('\n');
}

// Dispatch

function buildBackend(spec: ProjectSpec): { filename: string; content: string } {
  switch (spec.backendLang) {
    case 'ts':
      return { filename: 'server.ts', content: genTsBackend(spec) };
    case 'python':
      return {
        filename: 'server.py',
        content: spec.pythonPattern === 'pydantic' ? genPydantic(spec) : genJsonResponse(spec),
      };
    case 'java':
      return { filename: `${spec.controllerClass}.java`, content: genJavaController(spec) };
  }
}

function buildFrontend(spec: ProjectSpec): { filename: string; content: string } {
  const ext = spec.frontendExt;
  if (spec.backendLang === 'java')   return { filename: `client.${ext}`, content: genJavaFrontend(spec) };
  if (spec.backendLang === 'python') return { filename: `client.${ext}`, content: genPythonFrontend(spec) };

  switch (spec.tsPattern) {
    case 'direct':         return { filename: `client.${ext}`, content: genDirect(spec) };
    case 'destructuring':  return { filename: `client.${ext}`, content: genDestructuring(spec) };
    case 'optional-chain': return { filename: `client.${ext}`, content: genOptionalChain(spec) };
    case 'jsx':            return { filename: `client.${ext}`, content: genJsx(spec) };
    case 'template':       return { filename: `client.${ext}`, content: genTemplate(spec) };
    case 'dynamic':        return { filename: `client.${ext}`, content: genDynamic(spec) };
    case 'dynamic-mixed':  return { filename: `client.${ext}`, content: genDynamicMixed(spec) };
    default:               return { filename: `client.${ext}`, content: genDirect(spec) };
  }
}

// Main

function generate(): void {
  const benchDir = path.resolve(__dirname);
  console.log('Generating RQ1 benchmark projects...\n');

  for (const spec of SPECS) {
    const projectDir  = path.join(benchDir, `project-${spec.id}`);
    const backend     = buildBackend(spec);
    const frontend    = buildFrontend(spec);

    write(path.join(projectDir, 'backend',  backend.filename),  backend.content);
    write(path.join(projectDir, 'frontend', frontend.filename), frontend.content);
    write(path.join(projectDir, 'expected.json'), JSON.stringify(
      { endpoint: spec.endpoint, deadFields: spec.deadFields }, null, 2
    ) + '\n');

    console.log(`  ✓ project-${spec.id}  ${spec.description}`);
  }

  console.log(`\nDone — ${SPECS.length} projects written to ${benchDir}`);
}

generate();
