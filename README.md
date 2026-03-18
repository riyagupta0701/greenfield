# GreenField

**GreenField** is a VS Code extension that detects **unused JSON fields between frontend and backend codebases**, highlighting wasted network payload and unnecessary serialization work.

By statically analysing API calls and route handlers across a project, GreenField identifies fields that are transmitted but never used, helping developers improve **efficiency, sustainability, and maintainability**.


# Motivation

Modern web applications frequently transmit **more data than the frontend actually consumes**.

Example:

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "lastLoginIp": "192.168.1.10"
}
```

If the frontend only reads `name` and `email`, then `id` and `lastLoginIp` are **dead fields**. These cause unnecessary bandwidth usage, additional CPU parsing overhead, and wasted energy in large-scale systems. GreenField detects these automatically.


# Architecture

GreenField operates as a **static analysis pipeline inside VS Code**.

```
Workspace
   ↓
Endpoint Mapper
   ↓
Field Extractors
   ↓
Usage Tracker
   ↓
Diff Engine
   ↓
Sustainability Scorer
   ↓
VS Code Diagnostics
```


# Core Components

## 1. Endpoint Mapper

Builds a **canonical registry of API endpoints** by analysing both frontend and backend code.

**Frontend detection** — detects `fetch`, `axios.get/post/put/delete`, `doFetch` calls and extracts the URL.

**Backend detection** — detects Express `app.get/post/put/delete`, Flask `@app.route`, and Spring `@GetMapping/@PostMapping` and extracts the route pattern.

**URL normalization:**

| Input              | Normalized          |
| ------------------ | ------------------- |
| `/api/users/:id`   | `/api/users/:param` |
| `/api/users/{id}`  | `/api/users/:param` |
| `/api/users/<id>`  | `/api/users/:param` |
| `/api/users/${id}` | `/api/users/:param` |


## 2. Field Extractor

Extracts the fields a backend *sends* in responses, and the fields a frontend *sends* in request bodies.

**TypeScript/JavaScript** — uses `ts-morph` AST. Detects inline object literals in:

```ts
axios.post('/api/users', { username, email, password })

fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({ customerId, items, notes })
})
```

**Python** — regex-based. Detects response fields from:

```python
return jsonify({"userId": 1, "email": "a@b.com"})   # Flask
return {"status": "ok", "token": "abc"}              # FastAPI direct dict
return JSONResponse(content={"id": 1, "name": "x"}) # FastAPI JSONResponse

class UserResponse(BaseModel):   # Pydantic model fields
    userId: int
    displayName: str
```

**Java** — regex-based. Detects response fields from:

```java
private String firstName;           // DTO class fields
@JsonProperty("phone_number")       // annotation overrides Java identifier
private String phoneNumber;

Map.of("userId", id, "name", name)  // Map.of()
map.put("displayName", value)       // HashMap.put()
```

## 3. Usage Tracker

Detects which fields are actually *read* on the receiving side.

**TypeScript/JavaScript** — uses `ts-morph` AST. Covers all frontend access patterns:

```ts
response.id                          // direct property access
response.user?.name                  // optional chaining
const { email, role } = response     // destructuring
const { createdAt: joinedAt } = res  // aliased destructuring → tracks "createdAt"
const { address: { city } } = res    // nested destructuring
`Hello ${user.firstName}`            // template literals
<p>{user.displayName}</p>            // JSX
```

**Python** — regex-based. Detects which request fields the backend reads:

```python
request.json.get('username')         # direct get
request.json['email']                # bracket access
data = request.json; data.get('x')   # indirect via variable
request.form.get('title')            # form fields
request.args.get('page')             # query params

def create(item: UserModel): ...     # Pydantic param — all model fields marked as accessed
```

**Java** — regex-based. Detects which request fields the backend reads:

```java
@RequestBody UserDto req             // getter calls: req.getFirstName() → "firstName"
req.firstName                        // direct field access
@RequestParam("query") String q      // explicit param name
@RequestParam String category        // param variable name used as field name
request.getParameter("authToken")    // servlet API
```

## 4. Diff Engine

```
dead_fields = defined_fields − accessed_fields
```


## 5. Sustainability Scorer

```
waste = avg_field_size × request_volume
CO₂/day = wasted_bytes × request_volume × 0.000000006 kWh/byte
```

CO₂ coefficient from Aslan et al. (2018), surfaced transparently as an estimate.

# Supported Stack

| Layer | Support |
|---|---|
| Frontend | TypeScript / JavaScript (React, Vue, fetch / axios / doFetch) |
| Backend | Python (Flask, FastAPI), Java (Spring Boot), Node.js (Express) |
| API style | REST / JSON |


# Repository Structure

```
src/
 ├ endpointMapper/
 │   ├ backendDetector.ts
 │   ├ frontendDetector.ts
 │   ├ urlNormalizer.ts
 │   └ index.ts
 ├ diffEngine/
 │   ├ differ.ts
 │   ├ scorer.ts
 │   └ index.t
 ├ parsers/
 │   ├ typescript/
 │   │   ├ fieldExtractor.ts
 │   │   ├ usageTracker.ts
 │   │   └ index.t
 │   ├ python/
 │   └ java/
 ├ ui/
 │   ├ diagnosticProvider.ts
 │   ├ hoverProvider.ts
 │   ├ panel.ts
 │   ├ quickFix.ts
 │   └ statusBar.ts
 ├ types.ts
 └ extension.ts

scripts/
 └ scan.js    # Standalone CLI scanner (no VS Code required)

test/
 ├ __mocks__/vscode.ts
 └ suite/     # 102 tests across 7 suites
```


# Shared Interfaces

All components communicate through `src/types.ts`:

```typescript
interface Endpoint {
  pattern: string        // "GET /api/users/:param"
  method: string
  backendFile: string
  frontendFiles: string[]
}

interface Field {
  name: string
  side: 'request' | 'response'
  definedAt: string      // "path/to/file.ts:42"
  wasteScore?: number    // bytes × request volume
}

interface FieldSet {
  endpoint: Endpoint
  definedFields: Field[]
  accessedFields: Field[]
  deadFields?: Field[]
}
```


# Installation

```bash
git clone <repo-url>
cd GreenField
npm install
npm run compile
```


# Running the Extension

1. Open the GreenField project folder in VS Code (`File → Open Folder → select the GreenField directory`)

2. Press F5 — this opens a second VS Code window called the Extension Development Host

3. In that second window (not the original one), open a folder that contains the project you want to scan

4. In that second window, open the Command Palette with `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)

5. Type `GreenField: Scan Workspace` and press Enter

The extension scans all `.ts/.tsx/.js/.jsx/.py/.java` files and outputs a JSON endpoint registry.


# Standalone CLI Scanner

Run GreenField against any TypeScript project without VS Code:

```bash
node scripts/scan.js /path/to/project/
```

It prints endpoints, extracted fields, usage tracking, and dead field analysis in the terminal. 


# Development Workflow

```bash
npm run compile   # compile extension
npm test          # compile + run test suite
npm run watch     # incremental compile on save
F5                # launch Extension Development Host
```


# Running the Tests

```bash
npm test
```

This compiles the test build (`tsconfig.test.json` → `dist-test/`) and then runs all test files matching `dist-test/test/suite/**/*.test.js` with Mocha.

**Run a single test file:**

```bash
npx mocha 'dist-test/test/suite/pythonFieldExtractor.test.js' --timeout 10000
```

Replace the filename with any of the test files below.

**Test suites:**

| File | What it tests |
|---|---|
| `test/suite/fieldExtractor.test.ts` | TypeScript/JS frontend field extraction (axios, fetch + JSON.stringify) |
| `test/suite/usageTracker.test.ts` | TypeScript/JS frontend usage tracking (destructuring, optional chaining, JSX) |
| `test/suite/pythonFieldExtractor.test.ts` | Python backend field extraction (Flask `jsonify`, FastAPI `JSONResponse`, Pydantic `BaseModel`) |
| `test/suite/pythonUsageTracker.test.ts` | Python backend usage tracking (`request.json.get()`, bracket access, indirect access, Pydantic params) |
| `test/suite/javaFieldExtractor.test.ts` | Java backend field extraction (DTO fields, `@JsonProperty` override, `Map.of()`, `.put()`) |
| `test/suite/javaUsageTracker.test.ts` | Java backend usage tracking (`@RequestBody` getters + direct access, `@RequestParam`, `getParameter()`) |
| `test/suite/integration.test.ts` | End-to-end pipeline: endpoint mapping → field extraction → usage tracking → dead field diff |

**Test fixtures** (real source files the parsers run against) are in `test/suite/fixtures/unit/`.

# Real-World Evaluation

GreenField has been run against a public open-source repository to validate detection and surface limitations.

## Scan 1 — Mattermost

A large-scale production TypeScript codebase: React + Redux frontend, Go backend.

| Metric | Value |
|---|---|
| Files scanned | 4,157 |
| Endpoints mapped | 73 |
| Request body fields found | 178 |
| Response fields tracked | 49,679 |
| Backend response fields | 0 |

### To replicate:

```bash
git clone https://github.com/mattermost/mattermost.git
```

```bash
node scripts/scan.js /path_to_cloned_mattermost_repo
```
