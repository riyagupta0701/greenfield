# Synthetic Benchmark Projects (RQ1)

20 synthetic full-stack projects with injected known dead fields for precision/recall evaluation.

Each project directory contains:
- `backend/` — server code with defined response/request fields
- `frontend/` — client code that accesses a subset of those fields
- `expected.json` — ground truth listing which fields are dead

## Patterns Covered

- [ ] Direct field access (`response.email`)
- [ ] Destructuring (`const { email, name } = response`)
- [ ] Optional chaining (`response.user?.email`)
- [ ] Template literals / JSX (`{user.name}`)
- [ ] Dynamic bracket access (`obj[key]`) — must NOT be flagged
- [ ] Pydantic model binding
- [ ] Spring @RequestBody binding
