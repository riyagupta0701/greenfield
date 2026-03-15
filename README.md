# GreenField

**GreenField** is a VS Code extension that detects **unused JSON fields between frontend and backend codebases**, highlighting wasted network payload and unnecessary serialization work.

By statically analyzing API calls and route handlers across a project, GreenField identifies fields that are transmitted but never used, helping developers improve **efficiency, sustainability, and maintainability**.

---

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

If the frontend only reads:

```
name
email
```

then `id` and `lastLoginIp` are **dead fields**.

These unused fields cause:

* unnecessary bandwidth usage
* additional CPU parsing overhead
* wasted energy in large-scale systems

GreenField detects these automatically.

---

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

---

# Core Components

## 1. Endpoint Mapper

Builds a **canonical registry of API endpoints** by analyzing both frontend and backend code.

### Frontend detection

Detects calls such as:

```
fetch("/api/users/123")

axios.get("/api/orders")

axios.post("/api/products")
```

### Backend detection

Detects routes such as:

```
app.get("/api/users/:id")

app.get("/api/orders")

app.post("/api/products")
```

### URL normalization

Different parameter syntaxes are normalized:

| Input              | Normalized          |
| ------------------ | ------------------- |
| `/api/users/:id`   | `/api/users/:param` |
| `/api/users/{id}`  | `/api/users/:param` |
| `/api/users/<id>`  | `/api/users/:param` |
| `/api/users/${id}` | `/api/users/:param` |

Resulting canonical endpoint:

```
GET /api/users/:param
```

---

## 2. Field Extractor

Extracts fields defined in:

* backend JSON responses
* frontend request bodies

Example backend:

```js
res.json({
  name: "Alice",
  email: "alice@test.com",
  lastLoginIp: "192.168.1.10"
})
```

---

## 3. Usage Tracker

Detects which fields the frontend actually reads:

```
user.name
user.email
```

Supports:

* property access
* destructuring
* optional chaining
* JSX usage

---

## 4. Diff Engine

Computes unused fields.

```
dead_fields = defined_fields − accessed_fields
```

Example:

| Field       | Status |
| ----------- | ------ |
| name        | used   |
| email       | used   |
| lastLoginIp | unused |

---

## 5. Sustainability Scorer

Each dead field receives an estimated waste score:

```
waste = average_field_size × request_volume
```

Metrics include:

* wasted bytes per request
* estimated CO₂ impact
* serialization overhead

---

# Supported Stack (MVP)

| Layer      | Support                 |
| ---------- | ----------------------- |
| Frontend   | TypeScript / JavaScript |
| Backend    | Node.js (Express)       |
| Frameworks | fetch / axios           |
| API Style  | REST / JSON             |

Future support includes:

* Python (FastAPI / Flask)
* Java (Spring Boot)

---

# Repository Structure

```
src
 ├ endpointMapper
 │   ├ backendDetector.ts
 │   ├ frontendDetector.ts
 │   ├ urlNormalizer.ts
 │   └ index.ts
 │
 ├ diffEngine
 │   ├ differ.ts
 │   ├ scorer.ts
 │   └ index.ts
 │
 ├ parsers
 │   ├ typescript
 │   ├ python
 │   └ java
 │
 ├ ui
 │   ├ diagnosticProvider.ts
 │   ├ hoverProvider.ts
 │   ├ panel.ts
 │   ├ quickFix.ts
 │   └ statusBar.ts
 │
 ├ types.ts
 └ extension.ts
```

---

# Installation

Clone the repository:

```
git clone <repo-url>
cd greenfield
```

Install dependencies:

```
npm install
```

Compile the extension:

```
npm run compile
```

---

# Running the Extension

Open the project in VS Code and press:

```
F5
```

This launches an **Extension Development Host**.

In the new VS Code window:

1. Open a project workspace
2. Run the command

```
GreenField: Scan Workspace
```

The extension will analyze the project and display detected endpoints.

---

# Example Test Project

Frontend:

```
fetch(`/api/users/${userId}`)

axios.get("/api/orders")

axios.post("/api/products")
```

Backend:

```
app.get("/api/users/:id")

app.get("/api/orders")

app.post("/api/products")
```

GreenField detects:

```
GET /api/users/:param
GET /api/orders
POST /api/products
```

---

# Example Output

```
[
  {
    "pattern": "GET /api/users/:param",
    "method": "GET",
    "backendFile": "backend.ts",
    "frontendFiles": ["frontend.ts"]
  },
  {
    "pattern": "GET /api/orders",
    "method": "GET",
    "backendFile": "backend.ts",
    "frontendFiles": ["frontend.ts"]
  },
  {
    "pattern": "POST /api/products",
    "method": "POST",
    "backendFile": "backend.ts",
    "frontendFiles": ["frontend.ts"]
  }
]
```

---

# Development Workflow

1. Run TypeScript compiler

```
npm run compile
```

2. Launch extension

```
F5
```

3. Run command

```
GreenField: Scan Workspace
```

---



