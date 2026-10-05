# Design decisions, trade-offs and performance

## Key decisions

**1. Salaries are never compared or summed across currencies.**
Each country pays in its own currency and there is no FX source of truth. Converting at an arbitrary
rate would produce numbers that *look* authoritative but aren't. Every statistic is scoped to one
country, and the UI says so. *Trade-off:* no single "total payroll" number. Adding it later needs an
`exchange_rates` table with an effective date and a clear label like "USD at rates as of 2026-09-30".

**2. Currency is derived from country, not stored.**
One fewer field to get wrong, and an impossible state (a US employee paid in INR) can't exist.
*Trade-off:* a contractor paid in a different currency than their country can't be represented.
That's acceptable for this scope and easy to add later as a nullable override column.

**3. Medians and percentiles are computed in Ruby, not SQL.**
SQLite has no `PERCENTILE_CONT`. Plucking 10k integers and sorting them takes about 5 ms. Keeping the
maths in a pure `SalaryStats` module makes it trivially testable and DB-agnostic. Percentiles use
linear interpolation (Excel `PERCENTILE.INC`) so HR's numbers match what they computed before.
*When this stops scaling:* around 1M rows, or with many concurrent users. Then move to Postgres
`percentile_cont` or pre-aggregated stats refreshed on write.

**4. Median and p25–p75 are the headline numbers, not the mean.**
Salary data is right-skewed. A few executives inflate the mean, and the median is what a "typical"
employee earns. The mean is still shown, but secondary.

**5. Peer group = same job title + same country.**
This is the simplest definition HR will accept as fair, and it's directly answerable from the data.
The compa-ratio (salary / peer median) is the industry-standard single number; we also give it in words
("9% below peer median"), because the persona is not an analyst.

**6. SQLite.**
It's the right size for 10k rows and a single HR user: zero ops, file-based, and fast. Nothing is
SQLite-specific except the `LIKE` search, so the move to Postgres is a `database.yml` change.
*Trade-off:* single writer, and it needs a persistent disk in production (the demo deploy runs without one and reseeds on boot; see `render.yaml`).

**7. Reference data (countries, departments) lives in code, not tables.**
It changes rarely, it's reviewed in PRs, and it needs no admin UI. Job titles are *open* (free text
with suggestions) so HR can introduce a role without a deploy. Departments are *closed* because
reports group by them.

**8. A plain service layer, not a framework.**
Controllers are thin. Queries (`EmployeeQuery`), analytics (`PayInsights`) and maths (`SalaryStats`)
are plain Ruby objects with no gems such as Ransack, Pagy or serializer libraries. There's less magic
and every line is visible to a reviewer.

**9. One deployable.**
Rails serves the built React app, so there is one URL, one service, and no CORS in production. CORS can
still be switched on with `CORS_ORIGINS` if the UI is ever hosted separately.

**10. Filters live in the URL.**
HR can bookmark "Account Executives in Brazil, highest paid first" or send it to a colleague, and
refresh and back/forward just work.

**11. Sign-in with a session cookie and two roles.**
Added after the security review; it was out of scope in the first version. A server-side session in
an `HttpOnly` cookie was chosen over a JWT in browser storage: scripts cannot read it, so a
cross-site-scripting bug cannot steal it, and signing out really ends it. The cost is needing CSRF
protection, which Rails provides. Two roles (HR manager, read-only) are a single method on `User`,
not a policy framework such as Pundit: one rule does not justify a library. *Trade-off:* passwords are
stored here (bcrypt) and users come from the seed; a real deployment should use company SSO instead.

## Performance

Measured locally on 10,000 seeded employees (Apple Silicon, Rails dev server, median of 3 runs):

| Endpoint | Time |
|---|---|
| `GET /employees` (page 1) | 3 ms |
| `GET /employees?q=patel&country=IN&sort=salary&direction=desc` | 4 ms |
| `GET /employees?page=400` (deep offset) | 3 ms |
| `GET /employees/:id` (with peer comparison) | 2 ms |
| `GET /insights/countries/US` | 6 ms |
| `GET /insights/overview` (all 10k salaries) | 11 ms |

- **Seeding:** 10k rows in about 0.3 s using `insert_all` in batches of 1,000, versus about 30 s with
  `create!`. Because `insert_all` skips validations, a spec asserts that seeded rows pass them.
- **Pagination:** offset-based. It's fine at 10k (400 pages). Keyset pagination would be the upgrade at millions of rows.
- **Search:** `LIKE '%term%'` is a table scan. It's still about 4 ms at 10k. At larger scale, use SQLite FTS5 or Postgres `pg_trgm`.
- **Frontend:** React Query caches responses, `keepPreviousData` avoids table flicker between pages,
  search is debounced (300 ms), and the chart library is lazy-loaded (about 100 kB gzipped) only on
  the country page.

## Security

See [SECURITY.md](SECURITY.md) for the OWASP Top 10 review, the hardening added from it, and the list
of what must exist before the app holds real salary data (authentication and an audit trail first).
