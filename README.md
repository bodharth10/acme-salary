# ACME Salary Manager

Web app for ACME's HR Manager to manage salaries for 10,000 employees across 10 countries, and to
answer "how do we pay people?" without Excel.

**Stack:** Ruby on Rails 8.1 (API) · SQLite · React 19 + TypeScript (Vite) · Mantine UI · React Query · RSpec · Vitest

## Demo logins

The seed creates two accounts so both roles can be tried. These passwords are public on purpose and
are for the demo only.

| Role | Email | Password | Can do |
|---|---|---|---|
| HR Manager | `hr@acme.example` | `acme-hr-demo-2026` | Everything: view, add, edit, delete |
| Read-only | `viewer@acme.example` | `acme-viewer-demo-2026` | View employees and insights only |

On a deployment with real data, set `HR_PASSWORD` and `VIEWER_PASSWORD` before seeding, or remove
these users.

## What it does

- **Sign-in with two roles:** HR managers can change salary data; read-only users can only view it. The server enforces this on every request.
- **Employee directory:** search, filter (country / department / title), sort, and paginate 10k employees. Filters are kept in the URL.
- **Add / edit / delete** with validation. Currency is derived from country, so it can't be wrong.
- **Pay vs. peers** on every employee: peer median, typical range (p25–p75), compa-ratio, percentile.
- **Pay insights:** per-country medians and ranges, and per-country breakdowns by department and job title with a salary distribution chart. You can click through to the underlying employees.

## Docs

| Doc | Contents |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | One-page requirements: goal, scope, what's left out and why |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagram, layers, API, data model |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Trade-offs, performance numbers, security notes |
| [docs/SECURITY.md](docs/SECURITY.md) | OWASP Top 10 review, hardening added, what's needed before real data |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | How AI tools were used, prompts, and where AI output was corrected |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Walkthrough used for the video demo |

## Run locally

Prerequisites: Ruby 3.4, Node 22.

```bash
# API on :3000 (creates the DB, the demo logins and 10,000 employees)
cd backend
bundle install
bin/rails db:prepare db:seed
bin/rails server
```

```bash
# UI on :5173 (proxies /api to :3000)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with one of the demo logins above.

Re-generate the seed data at any time (deterministic: same data every run):

```bash
cd backend && RESEED=1 bin/rails db:seed
```

## Tests

```bash
cd backend && bundle exec rspec          # 89 examples, < 1s
cd frontend && npm test                  # 37 tests, ~2s
```

Backend: model validations and normalisation, statistics maths, query filtering/sorting/pagination,
insights, the seeder (determinism and validity), request specs for every endpoint including
error cases, authentication and role checks (session expiry, CSRF, login throttling, read-only
role), and security hardening (headers, rate limiting, database constraints). Frontend: formatting, form validation and mapping, URL filter state, the API client, and
component tests for the login page, employee form and peer comparison card. CI runs both suites, plus rubocop,
type-checking, a production build and security scans (Brakeman, bundler-audit, npm audit), on every push (`.github/workflows/ci.yml`).

## Deploy

A single Docker image builds the React app and serves it from Rails (see [Dockerfile](Dockerfile)).

**Render (one click):** push to GitHub → Render → *New → Blueprint* → pick the repo. [render.yaml](render.yaml)
creates a free web service with a generated `SECRET_KEY_BASE`. Each boot creates the database and seeds
the 10,000 employees. The free plan has no persistent disk, so the demo resets to the seed data on
restart, and the first request after idle takes up to a minute while the instance wakes. `render.yaml`
shows the two lines to add for a persistent disk.

**Any Docker host:**

```bash
docker build -t acme-salary .
docker run -p 3000:3000 -e SECRET_KEY_BASE=$(openssl rand -hex 64) -e FORCE_SSL=false -v acme-data:/app/storage acme-salary
```

## Project layout

```
backend/    Rails API: models, services (query, insights, stats, seeder), controllers, specs
frontend/   React SPA: api client + hooks, pages, components, lib (pure helpers), tests
docs/       Requirements, architecture, decisions, AI usage, demo script
```
