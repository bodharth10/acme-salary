# Security and production-readiness review

A review of the application against the OWASP Top 10 (2021), with what is in place, what was added as
a result of the review, and what is still open. The open items are stated plainly: the app now has
sign-in and role checks, but it **should not hold real salary data until it has an audit trail and
company single sign-on**.

## OWASP Top 10

| # | Risk | Status | Detail |
|---|---|---|---|
| A01 | Broken access control | Addressed | Every API endpoint requires a signed-in session; a spec walks all of them and expects 401 without one. Writes also require the HR manager role; a read-only user gets 403 (specs cover create, update and delete). The rule lives in one place (`User#can_manage_employees?`). The UI hides controls the user cannot use, but the server is what enforces it. Clients cannot set `id` or `employee_code`. |
| A02 | Cryptographic failures | Addressed | HTTPS is forced in production with HSTS (`force_ssl`). No secrets are in the repository; `SECRET_KEY_BASE` comes from the environment. No passwords or tokens are stored. SQLite is not encrypted at rest: use disk encryption on the host, or Postgres with encryption, for real data. |
| A03 | Injection | Addressed | All queries go through Active Record with bound parameters. Search terms are escaped for `LIKE`. Sort column and direction are whitelisted (a spec sends a SQL-injection string and asserts it is ignored). React escapes all rendered values; there is no `dangerouslySetInnerHTML`. A Content-Security-Policy blocks inline and third-party scripts. |
| A04 | Insecure design | Partly | Rate limiting per IP (300 requests/min, 60 writes/min) limits scraping and abuse. Page size is capped at 100 and search terms at 100 characters. A database `CHECK (salary > 0)` backs up the model validation. Open: no audit trail of salary changes, hard deletes, and no protection against two people editing the same record at once. |
| A05 | Security misconfiguration | Addressed | Security headers on every response, including static files: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. API responses are `Cache-Control: no-store`. Host header checking via `APP_HOSTS`. CORS is off unless `CORS_ORIGINS` is set. Production never renders stack traces; unknown API paths return a JSON 404. The container runs as a non-root user. |
| A06 | Vulnerable and outdated components | Addressed | Upgraded from Rails 7.2 (end of support August 2026) to Rails 8.1 and from Ruby 3.3.0 to 3.4. Upgraded React Router 6 to 7 to clear two advisories. CI runs Brakeman, bundler-audit and `npm audit` on every push. |
| A07 | Identification and authentication failures | Partly | Passwords are stored as bcrypt digests, minimum 12 characters. Login gives one generic error for a wrong email or a wrong password and takes the same time for both. Login attempts are limited to 5 per minute per IP and per account. The session is reset on sign-in (no session fixation), expires after 30 idle minutes, and lives in an encrypted cookie that is `HttpOnly`, `SameSite=Lax` and `Secure` in production. Open: no multi-factor authentication, no password reset, no account lockout beyond throttling. Company SSO would replace all three. |
| A08 | Software and data integrity failures | Addressed | Dependencies are pinned by lockfiles (`Gemfile.lock`, `package-lock.json`) and installed with `bundle install --deployment` and `npm ci`. No deserialization of untrusted data. The image is built from source in CI/CD, not from unverified artifacts. |
| A09 | Logging and monitoring failures | Partly | Requests are logged to stdout with a request ID. Salary, name and email are filtered out of logs. A health check exists at `/up`. Open: no audit log of who changed what, no error tracking or alerting service. |
| A10 | Server-side request forgery | Not applicable | The server makes no outbound requests based on user input. |

**CSRF.** Because sign-in uses a cookie, every state-changing request must also carry a CSRF token in
the `X-CSRF-Token` header. The SPA gets the token from `GET /api/v1/session` and keeps it in memory
only. A spec turns protection on and checks that a write without the token is rejected with 403.

**Demo credentials.** The README publishes two demo logins so reviewers can sign in. That is acceptable
only because the data is generated. Set `HR_PASSWORD` and `VIEWER_PASSWORD`, or remove those users, on
any deployment with real data.

## Added as a result of this review

| Change | Where |
|---|---|
| Sign-in, sessions, CSRF protection and roles, with specs | `backend/app/controllers/concerns/authentication.rb`, `sessions_controller.rb`, `app/models/user.rb` |
| Login page, sign out, role-aware UI, with tests | `frontend/src/pages/LoginPage.tsx`, `frontend/src/api/hooks.ts` |
| Security headers middleware, with specs | `backend/lib/middleware/security_headers.rb` |
| Rate limiting, with a spec | `backend/config/initializers/rack_attack.rb` |
| JSON 404 for unknown API paths | `backend/app/controllers/api/base_controller.rb`, `config/routes.rb` |
| Search term length cap | `backend/app/services/employee_query.rb` |
| Salary and name filtered from logs | `backend/config/initializers/filter_parameter_logging.rb` |
| Database check constraint on salary | `backend/db/migrate/20261005090000_add_salary_check_constraint.rb` |
| Host header allow-list | `backend/config/environments/production.rb` |
| Rails 8.1, Ruby 3.4, React Router 7 | `Gemfile`, `.ruby-version`, `package.json` |
| Security scans in CI | `.github/workflows/ci.yml` |
| React error boundary, with a test | `frontend/src/components/ErrorBoundary.tsx` |

## Before this holds real data

In priority order:

1. **Audit trail.** Record who changed which salary, when, and the old and new values. Replace hard
   delete with a termination date.
2. **Single sign-on.** Sign in through the company identity provider (OIDC) with multi-factor
   authentication, instead of passwords stored here. Remove the demo users.
3. **Database.** Move to Postgres with encryption at rest, automated backups and a tested restore.
4. **Concurrent edits.** Add optimistic locking (`lock_version`) so a second save cannot silently
   overwrite the first.
5. **Observability.** Error tracking, uptime alerts, and metrics on response time.
6. **Data protection.** A retention policy and an export/delete process for personal data (GDPR and
   similar), since the app holds names, emails and pay.

## Design principles in the code

The aim was the smallest set of patterns the problem needs, not every pattern available.

| Principle or pattern | Where it shows |
|---|---|
| Single responsibility | Controllers only translate HTTP; `EmployeeQuery` filters and paginates; `PayInsights` aggregates; `SalaryStats` does maths; `EmployeeSerializer` shapes JSON. |
| Query object | `EmployeeQuery` holds all list filtering, sorting and paging rules in one place. |
| Service object | `PayInsights`, `EmployeeSeeder`. |
| Value object | `Country` is an immutable `Data` object; currency is derived from it, never stored. |
| Pure functions | `SalaryStats` and the frontend `lib/` helpers have no I/O, so tests are fast and deterministic. |
| Dependency direction | Controllers depend on services, services on models; nothing lower depends on anything higher. |
| Fail safely | Deny by default: every API controller requires a session unless it opts out. Whitelists for sort and writable fields; one error format for 400/401/403/404/422/429; an error boundary in the UI. |
| Concern (mixin) | `Authentication` holds session handling in one module shared by all API controllers. |
| Defence in depth | Client validation, model validation, and database constraints (unique indexes, `NOT NULL`, `CHECK`). |
| Don't repeat yourself | One API client, one set of React Query hooks, one `QueryState` for loading and errors. |
| Not used, on purpose | Repository layer, dependency-injection container, CQRS, event sourcing. Each would add indirection without solving a problem this app has. |
