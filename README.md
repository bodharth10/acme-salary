# ACME Salary Manager

Web app for ACME's HR Manager to manage salaries for 10,000 employees across 10 countries, and to
answer "how do we pay people?" without Excel.

**Stack:** Ruby on Rails 7.2 (API) · SQLite · React 19 + TypeScript (Vite) · Mantine UI · React Query · RSpec · Vitest

## What it does

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
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | How AI tools were used, prompts, and where AI output was corrected |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Walkthrough used for the video demo |

## Run locally

Prerequisites: Ruby 3.3, Node 22.

```bash
# API on :3000 (creates the DB and seeds 10,000 employees)
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

Open http://localhost:5173.

Re-generate the seed data at any time (deterministic: same data every run):

```bash
cd backend && RESEED=1 bin/rails db:seed
```

## Tests

```bash
cd backend && bundle exec rspec          # 54 examples, < 1s
cd frontend && npm test                  # 26 tests, ~1s
```

Backend: model validations and normalisation, statistics maths, query filtering/sorting/pagination,
insights, the seeder (determinism and validity), and request specs for every endpoint including
error cases. Frontend: formatting, form validation and mapping, URL filter state, the API client, and
component tests for the employee form and peer comparison card. CI runs both suites, plus rubocop,
type-checking and a production build, on every push (`.github/workflows/ci.yml`).

## Deploy

A single Docker image builds the React app and serves it from Rails (see [Dockerfile](Dockerfile)).

**Render (one click):** push to GitHub → Render → *New → Blueprint* → pick the repo. [render.yaml](render.yaml)
creates the web service with a persistent disk for SQLite and a generated `SECRET_KEY_BASE`. The first
boot seeds the 10,000 employees.

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
